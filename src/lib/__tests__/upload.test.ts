import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readUpload, saveUpload, type SavedUpload, type UploadResult } from "../upload";

/** 附件存储接口测试：save（必传/白名单/魔数/20MB → error 文案，成功 → SavedUpload）与 read（读回/缺失）。
 *  dir 注入临时目录，不碰真实 uploads/——生产调用方走默认值。 */

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

/** 从联合结果中取出成功分支；带着 error 到这里说明断言目标错了 */
function savedOf(result: UploadResult): SavedUpload {
  if ("error" in result) throw new Error(`预期成功，得到文案：${result.error}`);
  return result;
}

describe("saveUpload 校验失败 → error 文案（不再 throw）", () => {
  const errorOf = async (f: File | null) => {
    const result = await saveUpload(f, dir);
    if (!("error" in result)) throw new Error(`预期失败，却保存成功：${result.filePath}`);
    return result.error;
  };

  it("null 视为未上传，返回必传文案", async () => {
    await expect(errorOf(null)).resolves.toBe("请上传附件");
  });

  it("白名单外扩展名", async () => {
    await expect(errorOf(fileOf("virus.exe", "x"))).resolves.toContain("不支持的文件格式");
  });

  it("无扩展名与点开头文件", async () => {
    await expect(errorOf(fileOf("README", "x"))).resolves.toContain("不支持的文件格式");
    await expect(errorOf(fileOf(".bashrc", "x"))).resolves.toContain("不支持的文件格式");
  });

  it("超过 20MB", async () => {
    const big = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "big.pdf");
    await expect(errorOf(big)).resolves.toBe("文件超过 20MB 限制");
  });

  it("空文件（有名字但 0 字节）", async () => {
    await expect(errorOf(fileOf("empty.txt", ""))).resolves.toBe("文件为空");
  });

  it("魔数与扩展名不符", async () => {
    await expect(errorOf(fileOf("fake.pdf", "not a pdf"))).resolves.toContain("文件内容与扩展名不符");
    await expect(errorOf(fileOf("fake.docx", "plain text"))).resolves.toContain("文件内容与扩展名不符");
  });

  it("doc 容忍 zip 魔数（新格式存旧扩展名，成功分支）", async () => {
    const saved = savedOf(await saveUpload(fileOf("legacy.doc", [0x50, 0x4b, 0x03, 0x04]), dir));
    expect(saved.fileType).toBe(".doc");
  });
});

describe("saveUpload 落盘", () => {
  it("返回入库字段且文件真实写入", async () => {
    const saved = savedOf(await saveUpload(fileOf("案例.txt", "附件内容"), dir));
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
    const saved = savedOf(await saveUpload(fileOf("a.txt", "往返内容"), dir));
    const buf = await readUpload(saved.filePath, dir);
    expect(buf?.toString("utf8")).toBe("往返内容");
  });

  it("文件缺失返回 null（缺失 ≠ 故障）", async () => {
    await expect(readUpload("nope.txt", dir)).resolves.toBeNull();
  });
});
