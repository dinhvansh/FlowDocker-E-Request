import { scrypt, timingSafeEqual, randomBytes } from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt);
export async function passwordVerifier(password: string, salt: string) {
  return (
    (await derive(password, salt, 64, {
      N: 131072,
      r: 8,
      p: 1,
      maxmem: 256 * 1024 * 1024,
    })) as Buffer
  ).toString("hex");
}
export async function createPassword(password: string) {
  if (password.length < 12 || password.length > 256)
    throw new Error("Password length must be 12–256");
  const salt = randomBytes(32).toString("hex");
  return { salt, verifier: await passwordVerifier(password, salt) };
}
export async function verifyPassword(
  password: string,
  salt: string,
  verifier: string,
) {
  const actual = Buffer.from(await passwordVerifier(password, salt), "hex");
  const expected = Buffer.from(verifier, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
