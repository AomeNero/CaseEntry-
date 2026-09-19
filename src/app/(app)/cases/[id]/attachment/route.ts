import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** 附件下载：已入库全员可下；过程态仅录入人本人与管理员 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("未登录", { status: 401 });

  const { id } = await params;
  const kase = await db.case.findUnique({ where: { id } });
  if (!kase) return new Response("案例不存在", { status: 404 });

  const allowed =
    kase.status === "PUBLISHED" || kase.authorId === user.id || user.role === "ADMIN";
  if (!allowed) return new Response("无权访问", { status: 403 });

  try {
    const buf = await readFile(path.join(process.cwd(), "uploads", kase.filePath));
    const encoded = encodeURIComponent(kase.fileName);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buf.length),
        "Content-Disposition": `attachment; filename="case${kase.fileType}"; filename*=UTF-8''${encoded}`,
      },
    });
  } catch {
    return new Response("附件文件缺失", { status: 404 });
  }
}
