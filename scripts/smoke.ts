/**
 * 端到端冒烟测试：对运行中的服务器发真实 HTTP 请求。
 * 覆盖：未登录重定向、会话鉴权、角色守卫、可见性规则、页面渲染、附件下载。
 * 不覆盖：server action 变更（需浏览器环境），由 vitest 单测 + 人工走查兜底。
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { COOKIE_NAME, signSessionToken, type SessionPayload } from "../src/lib/session-token";

const BASE = "http://localhost:3000";
const db = new PrismaClient();

// 解析 .env（脚本独立运行，不经 Next 加载）
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(process.cwd(), ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")])
);
process.env.AUTH_SECRET ??= env.AUTH_SECRET;

async function makeCookie(user: SessionPayload) {
  const token = await signSessionToken(user);
  return `${COOKIE_NAME}=${token}`;
}

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function get(pathname: string, cookie?: string) {
  const res = await fetch(`${BASE}${pathname}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  return { status: res.status, location: res.headers.get("location"), text: await res.text() };
}

async function main() {
  // ---------- 准备数据 ----------
  const usernames = ["smoke_u1", "smoke_u2"];
  const oldUsers = await db.user.findMany({ where: { username: { in: usernames } } });
  const oldIds = oldUsers.map((u) => u.id);
  await db.pointsLedger.deleteMany({ where: { userId: { in: oldIds } } });
  await db.case.deleteMany({ where: { authorId: { in: oldIds } } });
  await db.user.deleteMany({ where: { id: { in: oldIds } } });

  const cat = await db.category.upsert({
    where: { name: "网络" },
    update: {},
    create: { name: "网络" },
  });
  const hash = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8DAA7BjU0XcEBnJfTKKT1zAbfXWj0i"; // bcrypt("x")
  const u1 = await db.user.create({ data: { username: "smoke_u1", passwordHash: hash, name: "冒烟用户一" } });
  const u2 = await db.user.create({ data: { username: "smoke_u2", passwordHash: hash, name: "冒烟用户二" } });
  const admin = await db.user.findUniqueOrThrow({ where: { username: "admin" } });

  const attPath = "smoke-attachment.txt";
  fs.writeFileSync(path.join(process.cwd(), "uploads", attPath), "smoke-test-attachment-content");

  const caseBase = { categoryId: cat.id, fileName: "冒烟附件.txt", filePath: attPath, fileType: ".txt", fileSize: 30 };
  const caseA = await db.case.create({ data: { ...caseBase, title: "冒烟-待初审案例", authorId: u2.id, status: "PENDING_FIRST" } });
  const caseB = await db.case.create({ data: { ...caseBase, title: "冒烟-待终审案例", authorId: u2.id, status: "PENDING_FINAL" } });
  const caseC = await db.case.create({ data: { ...caseBase, title: "冒烟-已入库案例", authorId: u2.id, status: "PUBLISHED", grade: "A", publishedAt: new Date() } });
  const caseD = await db.case.create({ data: { ...caseBase, title: "冒烟-已驳回案例", authorId: u1.id, status: "REJECTED", rejectedStage: "FINAL", rejectReason: "冒烟驳回理由" } });

  // 积分流水：u2 应得 115 分（5+10+100），让榜单/报表有数据
  await db.pointsLedger.create({ data: { userId: u2.id, caseId: caseA.id, eventType: "SUBMIT", points: 5 } });
  await db.pointsLedger.create({ data: { userId: u2.id, caseId: caseB.id, eventType: "FIRST_PASS", points: 10 } });
  await db.pointsLedger.create({ data: { userId: u2.id, caseId: caseC.id, eventType: "FINAL_GRADE", points: 100 } });

  const adminCookie = await makeCookie({ sub: admin.id, username: "admin", name: admin.name, role: "ADMIN" });
  const u1Cookie = await makeCookie({ sub: u1.id, username: u1.username, name: u1.name, role: "USER" });

  // ---------- 未登录 ----------
  console.log("\n[未登录访问]");
  let r = await get("/");
  check("首页重定向到 /login", r.status === 307 && r.location === "/login", `got ${r.status} ${r.location}`);

  r = await get("/login");
  check("登录页可匿名访问", r.status === 200 && r.text.includes("登录 CaseEntry"));
  r = await get("/register");
  check("注册页可匿名访问", r.status === 200 && r.text.includes("注册 CaseEntry"));
  r = await get(`/cases/${caseC.id}/attachment`);
  check("未登录下载附件被拒 401", r.status === 401, `got ${r.status}`);

  // ---------- 普通用户 u1 ----------
  console.log("\n[普通用户 smoke_u1]");
  r = await get("/", u1Cookie);
  check("首页 200 且有动态流", r.status === 200 && r.text.includes("冒烟-已入库案例"));
  check("首页积分总榜出现 115 分", r.text.includes("115"));
  check("首页有本月积分榜", r.text.includes("本月积分榜"));

  r = await get("/cases", u1Cookie);
  const libraryVisibility =
    r.text.includes("冒烟-已入库案例") && // 他人已入库可见
    r.text.includes("冒烟-已驳回案例") && // 本人过程态（已驳回）可见
    !r.text.includes("冒烟-待初审案例") && // 他人待初审不可见
    !r.text.includes("冒烟-待终审案例"); // 他人待终审不可见
  check("案例库=已入库∪本人案例（他人过程态不可见）", libraryVisibility);

  r = await get(`/cases/${caseA.id}`, u1Cookie);
  check("非本人过程态案例 404", r.status === 404, `got ${r.status}`);
  r = await get(`/cases/${caseD.id}`, u1Cookie);
  check("本人驳回案例可见且可重交", r.status === 200 && r.text.includes("修改后重新提交"));
  r = await get(`/my`, u1Cookie);
  check("我的案例可见自己的驳回案例", r.status === 200 && r.text.includes("冒烟-已驳回案例") && r.text.includes("冒烟驳回理由"));
  r = await get("/profile", u1Cookie);
  check("个人中心有积分流水", r.status === 200 && r.text.includes("积分流水"));
  r = await get("/admin", u1Cookie);
  check("普通用户访问 /admin 被重定向", r.status === 307 && r.location === "/", `got ${r.status} ${r.location}`);

  // ---------- 管理员 ----------
  console.log("\n[管理员 admin]");
  r = await get("/admin", adminCookie);
  check("审核待办双队列渲染", r.status === 200 && r.text.includes("待初审") && r.text.includes("冒烟-待初审案例") && r.text.includes("冒烟-待终审案例"));
  check("初审卡片有通过按钮", r.text.includes("通过初审"));

  r = await get(`/cases/${caseA.id}`, adminCookie);
  check("管理员可见他人过程态案例", r.status === 200 && r.text.includes("通过初审"));

  r = await get("/admin/users", adminCookie);
  check("账号管理表格渲染", r.status === 200 && r.text.includes("smoke_u1") && r.text.includes("提为管理员"));

  r = await get("/admin/report", adminCookie);
  check("积分报表渲染（含合计）", r.status === 200 && r.text.includes("冒烟用户二") && r.text.includes("合计"));

  r = await get("/admin/points", adminCookie);
  check("积分配置页渲染", r.status === 200 && r.text.includes("积分配置"));

  r = await get("/admin/categories", adminCookie);
  check("分类管理页渲染", r.status === 200 && r.text.includes("网络"));

  r = await get(`/cases/${caseC.id}/attachment`, u1Cookie);
  check(
    "已入库附件已登录可下载",
    r.status === 200 && r.text === "smoke-test-attachment-content",
    `got ${r.status}`
  );

  console.log(`\n结果：${pass} 通过，${fail} 失败`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
