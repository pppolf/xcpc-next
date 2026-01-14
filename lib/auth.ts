import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

// 定义 Token 中包含的数据类型，与你在登录接口生成的保持一致
export interface UserJwtPayload {
  userId: string;
  username: string;
  role: string;
  contestId?: number | null;
  isGlobalAdmin: boolean;
  iat?: number;
  exp?: number;
}

// 获取密钥并转换为 Uint8Array（jose 要求的格式）
export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error("The environment variable JWT_SECRET is not set.");
  }
  return new TextEncoder().encode(secret);
};

export async function signAuth(payload: Omit<UserJwtPayload, "iat" | "exp">) {
  const secret = getJwtSecretKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // Token 有效期
    .sign(secret);
  return token;
}

export async function verifyAuth(token: string): Promise<UserJwtPayload> {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey());
    return verified.payload as unknown as UserJwtPayload;
  } catch (error) {
    console.log(error);
    throw new Error("Your token has expired or is invalid.");
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;

  if (!token) return null;

  try {
    const payload = await verifyAuth(token);
    return payload;
  } catch (error) {
    console.log(error);
    return new Error("Your token has expired or is invalid.");
  }
}

export async function getCurrentSuper() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const payload = await verifyAuth(token);
    return payload;
  } catch (error) {
    console.log(error);
    return new Error("Your token has expired or is invalid.");
  }
}
