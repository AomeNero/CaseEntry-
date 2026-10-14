import bcrypt from "bcryptjs";

/**
 * 密码哈希 adapter：钉住 bcrypt 与 cost=10 这两个可变事实。
 * 本体极薄（近乎直通），价值在于换算法/调 cost 时只改此一处、
 * 存量哈希校验不受影响——属有意保留的 swap seam。
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
