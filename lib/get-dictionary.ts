import "server-only"; // 确保此文件只在服务端通过
import { cookies } from "next/headers";
import { en, zh } from "./dictionaries";

// 这是一个异步函数，专门给 Server Component 用
export async function getDictionary() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("app-lang")?.value;

  // 默认为中文 'zh'
  return lang === "en" ? en : zh;
}
