"use server";

import { prisma } from "@/lib/prisma"; // 确保你导出了全局 prisma 实例
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir, rm } from "fs/promises";
import path from "path";

// 定义题目数据的类型接口
export interface ProblemFormData {
  title: string;
  type: string;
  defaultTimeLimit: number;
  defaultMemoryLimit: number;
  sections: { title: string; content: string }[];
  samples: { input: string; output: string }[];
  hint?: string;
}

// 获取题目列表
export async function getProblems(page = 1, pageSize = 20, query = "") {
  const skip = (page - 1) * pageSize;
  const where = query
    ? {
        OR: [
          { title: { contains: query } },
          // 如果 id 是数字，这里需要处理一下，暂时只搜标题
        ],
      }
    : {};

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { id: "desc" },
    }),
    prisma.problem.count({ where }),
  ]);

  return { problems, total };
}

// 获取单道题目
export async function getProblem(id: number) {
  return await prisma.problem.findUnique({ where: { id } });
}

// 创建或更新题目
export async function saveProblem(formData: FormData) {
  const id = formData.get("id") ? Number(formData.get("id")) : null;

  // 1. 解析基础数据
  const data: ProblemFormData = {
    title: formData.get("title") as string,
    type: (formData.get("type") as string) || "default",
    defaultTimeLimit: Number(formData.get("defaultTimeLimit")),
    defaultMemoryLimit: Number(formData.get("defaultMemoryLimit")),
    sections: JSON.parse(formData.get("sections") as string),
    samples: JSON.parse(formData.get("samples") as string),
    hint: formData.get("hint") as string,
  };

  let problem;

  if (id) {
    // 更新
    problem = await prisma.problem.update({
      where: { id },
      data,
    });
  } else {
    // 创建
    problem = await prisma.problem.create({
      data,
    });
  }

  // 2. 处理测试数据文件上传 (如果有)
  const file = formData.get("testData") as File | null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "problems",
      problem.id.toString(),
      "data"
    );

    // 清空并重新创建目录
    await rm(uploadDir, { recursive: true, force: true });
    await mkdir(uploadDir, { recursive: true });

    // 保存 zip 文件
    const zipPath = path.join(uploadDir, "data.zip");
    await writeFile(zipPath, buffer);

    // TODO: 这里可以调用解压函数、读取 YAML、更新 judgeConfig
    // 为了演示简洁，这里暂时只保存文件，实际开发需接入 unzip 逻辑
    console.log(`Saved test data to ${zipPath}`);
  }

  revalidatePath("/admin/problems");
  redirect("/admin/problems");
}

// 删除题目
export async function deleteProblem(id: number) {
  await prisma.problem.delete({ where: { id } });
  revalidatePath("/admin/problems");
}
