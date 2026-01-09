import { jwtVerify } from "jose";

// 定义 Token 中包含的数据类型，与你在登录接口生成的保持一致
interface UserJwtPayload {
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

export async function verifyAuth(token: string): Promise<UserJwtPayload> {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey());
    return verified.payload as unknown as UserJwtPayload;
  } catch (error) {
    console.log(error);
    throw new Error("Your token has expired or is invalid.");
  }
}
