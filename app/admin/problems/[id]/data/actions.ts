"use server";

import { promises as fs } from "fs";
import path from "path";
import yaml from "js-yaml";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getProblem } from "../../actions";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "problems");

function getDataDir(problemId: number) {
  if (!problemId || isNaN(problemId)) {
    throw new Error(`Invalid problemId: ${problemId}`);
  }
  return path.join(UPLOAD_ROOT, problemId.toString(), "data");
}

const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};

async function autoDetectCases(dir: string, currentYamlContent: string) {
  const files = await fs.readdir(dir);
  const inputs = files.filter((f) => f.endsWith(".in")).sort(naturalSort);
  const detectedCases = [];
  for (const input of inputs) {
    const basename = path.basename(input, ".in");
    const output = `${basename}.out`;
    if (files.includes(output)) {
      detectedCases.push({ input: input, output: output });
    }
  }
  let parsed: any = {};
  try {
    parsed = yaml.load(currentYamlContent) || {};
  } catch (e) {
    console.log(e);
  }
  if (detectedCases.length > 0) {
    parsed.cases = detectedCases;
  }
  return yaml.dump(parsed);
}

// 1. 获取数据
export async function getProblemData(problemId: number) {
  const dir = getDataDir(problemId);
  const problem = await getProblem(problemId);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }

  const files = await fs.readdir(dir);
  const fileStats = await Promise.all(
    files.map(async (file) => {
      const stat = await fs.stat(path.join(dir, file));
      return { name: file, size: stat.size, updatedAt: stat.mtime };
    })
  );

  const yamlPath = path.join(dir, "problem.yml");
  let yamlContent = "";
  try {
    yamlContent = await fs.readFile(yamlPath, "utf-8");
  } catch {
    yamlContent = `type: ${problem?.type}\ntime: ${problem?.defaultTimeLimit}ms\nmemory: ${problem?.defaultMemoryLimit}m\n`;
    await fs.writeFile(yamlPath, yamlContent);
  }

  return {
    files: fileStats.filter((f) => f.name !== "problem.yml"),
    yamlContent,
  };
}

// 2. 保存 YAML
export async function saveYamlConfig(problemId: number, content: string) {
  const dir = getDataDir(problemId);
  await fs.writeFile(path.join(dir, "problem.yml"), content);
  try {
    const parsed = yaml.load(content);
    await prisma.problem.update({
      where: { id: problemId },
      data: { judgeConfig: parsed as any },
    });
  } catch (e) {
    console.log(e);
  }
  revalidatePath(`/admin/problems/${problemId}/data`);
}

// 3. 上传文件
export async function uploadFiles(problemId: number, formData: FormData) {
  // 【检查】确保 problemId 存在
  if (!problemId) throw new Error("Missing Problem ID");

  const dir = getDataDir(problemId);
  const files = formData.getAll("files") as File[];

  for (const file of files) {
    if (file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(dir, file.name), buffer);
    }
  }

  const yamlPath = path.join(dir, "problem.yml");
  let currentYaml = "";
  try {
    currentYaml = await fs.readFile(yamlPath, "utf-8");
  } catch {}

  const newYaml = await autoDetectCases(dir, currentYaml);
  await saveYamlConfig(problemId, newYaml);
  return newYaml;
}

// 4. 删除文件
export async function deleteFile(problemId: number, fileName: string) {
  const filePath = path.join(getDataDir(problemId), fileName);
  try {
    await fs.unlink(filePath);
  } catch {}
  revalidatePath(`/admin/problems/${problemId}/data`);
}

// 【新增】读取文件内容
export async function getFileContent(problemId: number, fileName: string) {
  const filePath = path.join(getDataDir(problemId), fileName);
  try {
    // 限制读取文件大小，防止读取过大的数据文件导致崩盘 (例如限制 1MB)
    const stat = await fs.stat(filePath);
    if (stat.size > 1024 * 1024) {
      return "Error: File is too large to preview (limit 1MB).";
    }
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (e) {
    console.error(`Read file ${fileName} failed`, e);
    return "Error: Failed to read file.";
  }
}

// 【新增】保存文件内容
export async function saveFileContent(
  problemId: number,
  fileName: string,
  content: string
) {
  const dir = getDataDir(problemId);
  const filePath = path.join(dir, fileName);

  await fs.writeFile(filePath, content);
  revalidatePath(`/admin/problems/${problemId}/data`);
}
