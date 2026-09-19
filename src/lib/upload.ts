import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from "./validation";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export interface SavedUpload {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

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

/** 校验并保存上传附件到 uploads/，返回入库字段；校验失败抛出带原因的 Error */
export async function saveUpload(file: File): Promise<SavedUpload> {
  const ext = getExtension(file.name);
  if (!ext) throw new Error(`不支持的文件格式，仅允许：${ALLOWED_EXTENSIONS.join(" ")}`);
  if (file.size > MAX_FILE_SIZE) throw new Error("文件超过 20MB 限制");
  if (file.size === 0) throw new Error("文件为空");

  const buf = Buffer.from(await file.arrayBuffer());
  const check = MAGIC_CHECKS[ext];
  if (check && !check(buf)) throw new Error("文件内容与扩展名不符，已拒绝保存");

  const stored = `${crypto.randomUUID()}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, stored), buf);

  return { fileName: file.name, filePath: stored, fileType: ext, fileSize: buf.length };
}
