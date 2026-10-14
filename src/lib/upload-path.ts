import path from "path";

/** 附件存储位置的唯一出处：upload（读写）与 smoke（搭 fixture）双消费。
 *  纯常量零依赖——无 server-only、无 IO，脚本可安全引用（同 ADR-0004 的双 adapter 模式）。 */

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/** 由入库的 filePath（uuid+扩展名）拼出存储全路径 */
export function uploadPath(filePath: string): string {
  return path.join(UPLOAD_DIR, filePath);
}
