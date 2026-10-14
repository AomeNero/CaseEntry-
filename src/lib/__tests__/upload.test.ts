import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readUpload, saveUpload } from "../upload";

/** 附件存储接口测试：save（校验+落盘）与 read（缺失/读回），dir 注入临时目录，不碰真实 uploads/ */

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "caseentry-upload-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function fileOf(name: string, content: string | number[]): File {
  const part = typeof content === "string" ? content : new Uint8Array(content);
  return new File([part], name);
}

describe("saveUpload 校验", () => {
  it("白名单外扩展名拒绝", async () => {
    await expect(saveUpload(fileOf("virus.exe", "x"), dir)).rejects.toThrow("不支持的文件格式");
  });

  it("无扩展名与点开头文件拒绝", async () => {
    await expect(saveUpload(fileOf("README", "x"), dir)).rejects.toThrow("不支持的文件格式");
    await expect(saveUpload(fileOf(".bashrc", "x"), dir)).rejects.toThrow("不支持的文件格式");
  });

  it("超过 20MB 拒绝", async () => {
    const big = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "big.pdf");
    await expect(saveUpload(big, dir)).rejects.toThrow("20MB");
  });

  it("空文件拒绝", async () => {
    await expect(saveUpload(fileOf("empty.txt", ""), dir)).rejects.toThrow("文件为空");
  });

  it("魔数与扩展名不符拒绝", async () => {
    await expect(saveUpload(fileOf("fake.pdf", "not a pdf"), dir)).rejects.toThrow("文件内容与扩展名不符");
    await expect(saveUpload(fileOf("fake.docx", "plain text"), dir)).rejects.toThrow("文件内容与扩展名不符");
  });

  it("doc 容忍 zip 魔数（新格式存旧扩展名）", async () => {
    const saved = await saveUpload(fileOf("legacy.doc", [0x50, 0x4b, 0x03, 0x04]), dir);
    expect(saved.fileType).toBe(".doc");
  });
});

describe("saveUpload 落盘", () => {
  it("返回入库字段且文件真实写入", async () => {
    const saved = await saveUpload(fileOf("案例.txt", "附件内容"), dir);
    expect(saved.fileName).toBe("案例.txt");
    expect(saved.fileType).toBe(".txt");
    expect(saved.fileSize).toBe(Buffer.byteLength("附件内容"));
    expect(saved.filePath).toMatch(/\.txt$/);
    const stored = await readdir(dir);
    expect(stored).toContain(saved.filePath);
  });
});

describe("readUpload 读回", () => {
  it("save → read 往返内容一致", async () => {
    const saved = await saveUpload(fileOf("a.txt", "往返内容"), dir);
    const buf = await readUpload(saved.filePath, dir);
    expect(buf?.toString("utf8")).toBe("往返内容");
  });

  it("文件缺失返回 null（缺失 ≠ 故障）", async () => {
    await expect(readUpload("nope.txt", dir)).resolves.toBeNull();
  });
});
