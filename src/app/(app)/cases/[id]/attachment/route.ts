import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canView } from "@/lib/case-visibility";
import { readUpload } from "@/lib/upload";

/** 附件下载：可见性策略见 lib/case-visibility；本表面的错误形态是 401/403 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("未登录", { status: 401 });

  const { id } = await params;
  const kase = await db.case.findUnique({ where: { id } });
  if (!kase) return new Response("案例不存在", { status: 404 });

  if (!canView(user, kase)) return new Response("无权访问", { status: 403 });

  try {
    const buf = await readUpload(kase.filePath);
    if (!buf) return new Response("附件文件缺失", { status: 404 });
    const encoded = encodeURIComponent(kase.fileName);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buf.length),
        "Content-Disposition": `attachment; filename="case${kase.fileType}"; filename*=UTF-8''${encoded}`,
      },
    });
  } catch (e) {
    // 读路径真实故障（权限/磁盘）——不再伪装成 404，服务器端留下错误上下文
    console.error("[attachment] 附件读取失败", e);
    return new Response("附件读取失败", { status: 500 });
  }
}
