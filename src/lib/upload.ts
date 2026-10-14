import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "./validation";
import { UPLOAD_DIR } from "./upload-path";

export interface SavedUpload {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

/** save 的全部失败（必传/白名单/魔数/20MB/空文件/写盘故障）都返回 { error: 文案 }，不抛出——
 *  调用方是表单 action，返回值即结局（与 readUpload 的「结果承载领域结局」同一风格）。 */
export type UploadResult = SavedUpload | { error: string };

/** 扩展名（小写含点），非法时返回 null */
export function getExtension(fileName: string): string | null {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return null;
  const ext = fileName.slice(dot).toLowerCase();
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext) ? ext : null;
}

// 文件魔数校验：防止改扩展名绕过白名单
function startsWith(buf: Buffer, bytes: number[]): boolean {
  return bytes.every((b, i) => buf[i] === b);
}
function isZip(buf: Buffer): boolean {
  return buf.length >= 4 && startsWith(buf, [0x50, 0x4b]); // PK..（docx/pptx/xlsx）
}
function isOle2(buf: Buffer): boolean {
  return buf.length >= 4 && startsWith(buf, [0xd0, 0xcf, 0x11, 0xe0]); // 老版 Office（doc/ppt/xls）
}
function isPdf(buf: Buffer): boolean {
  return buf.subarray(0, 4).toString("latin1") === "%PDF";
}

const MAGIC_CHECKS: Record<string, (buf: Buffer) => boolean> = {
  ".docx": isZip,
  ".pptx": isZip,
  ".xlsx": isZip,
  ".doc": (b) => isOle2(b) || isZip(b), // 兼容"新格式存旧扩展名"
  ".ppt": (b) => isOle2(b) || isZip(b),
  ".xls": (b) => isOle2(b) || isZip(b),
  ".pdf": isPdf,
  // .txt / .md 为纯文本，不做魔数校验
};

/** 校验并保存上传附件，返回入库字段；任何失败返回 error 文案（必传文案统一「请上传附件」）。
 *  dir 仅测试注入，生产走默认 uploads/。 */
export async function saveUpload(file: File | null, dir: string = UPLOAD_DIR): Promise<UploadResult> {
  if (!file) return { error: "请上传附件" };

  const ext = getExtension(file.name);
  if (!ext) return { error: `不支持的文件格式，仅允许：${ALLOWED_EXTENSIONS.join(" ")}` };
  if (file.size > MAX_FILE_SIZE) return { error: "文件超过 20MB 限制" };
  if (file.size === 0) return { error: "文件为空" };

  const buf = Buffer.from(await file.arrayBuffer());
  const check = MAGIC_CHECKS[ext];
  if (check && !check(buf)) return { error: "文件内容与扩展名不符，已拒绝保存" };

  const stored = `${crypto.randomUUID()}${ext}`;
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, stored), buf);
  } catch {
    return { error: "附件保存失败" };
  }

  return { fileName: file.name, filePath: stored, fileType: ext, fileSize: buf.length };
}

/** 读取已保存附件。文件缺失（ENOENT）返回 null——「记录在、文件没了」是业务上有意义的结局；
 *  其他读取错误（权限/磁盘故障）抛出，由调用方决定表现（错误形态有意区分，同 case-visibility 的 404/403 风格）。 */
export async function readUpload(filePath: string, dir: string = UPLOAD_DIR): Promise<Buffer | null> {
  try {
    return await readFile(path.join(dir, filePath));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}
