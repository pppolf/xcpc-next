import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'problems');

function getDataDir(problemId: number) {
  return path.join(UPLOAD_ROOT, problemId.toString(), 'data');
}

function getAssetsDir(problemId: number) {
  return path.join(UPLOAD_ROOT, problemId.toString(), 'assets');
}

interface ProblemData {
  id?: number;
  title: string;
  type: string;
  defaultTimeLimit: number;
  defaultMemoryLimit: number;
  sections: { title: string; content: string }[];
  samples: { input: string; output: string }[];
  hint?: string;
  judgeConfig?: string;
}

export async function POST(request: Request) {
  try {
    // 1. 身份验证
    const token = (await cookies()).get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.isGlobalAdmin) {
      return NextResponse.json({ error: 'Only admin can perform this action' }, { status: 403 });
    }

    // 2. 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || !file.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
    }

    // 3. 读取ZIP文件
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const importedProblems: { id: number; title: string }[] = [];
    const errors: string[] = [];

    // 4. 遍历ZIP文件内容
    const zipEntries = Object.keys(zip.files);
    const problemDirs = new Set<string>();

    // 4.1 收集所有题目目录
    for (const entry of zipEntries) {
      if (entry.endsWith('/')) {
        problemDirs.add(entry);
      }
    }

    // 4.2 处理每个题目目录
    for (const problemDir of problemDirs) {
      try {
        // 4.2.1 读取题目信息
        const problemJsonEntry = zip.files[`${problemDir}problem.json`];
        if (!problemJsonEntry) {
          errors.push(`Missing problem.json in ${problemDir}`);
          continue;
        }

        const problemJsonContent = await problemJsonEntry.async('text');
        const problemData = JSON.parse(problemJsonContent) as ProblemData;

        // 4.2.2 验证题目数据
        if (!problemData.title || !problemData.type || !problemData.defaultTimeLimit || !problemData.defaultMemoryLimit) {
          errors.push(`Invalid problem data in ${problemDir}`);
          continue;
        }

        // 4.2.3 创建或更新题目
        const problem = await prisma.problem.create({
          data: {
            title: problemData.title,
            type: problemData.type,
            defaultTimeLimit: problemData.defaultTimeLimit,
            defaultMemoryLimit: problemData.defaultMemoryLimit,
            sections: problemData.sections,
            samples: problemData.samples,
            hint: problemData.hint,
            judgeConfig: problemData.judgeConfig,
          },
        });

        importedProblems.push({ id: problem.id, title: problem.title });

        // 4.2.4 处理数据文件
        const dataDir = getDataDir(problem.id);
        await fs.mkdir(dataDir, { recursive: true });

        const dataEntries = zipEntries.filter(entry => 
          entry.startsWith(`${problemDir}data/`) && !entry.endsWith('/')
        );

        for (const dataEntry of dataEntries) {
          const entry = zip.files[dataEntry];
          if (!entry) continue;

          const content = await entry.async('nodebuffer');
          const fileName = path.basename(dataEntry);
          await fs.writeFile(path.join(dataDir, fileName), content);
        }

        // 4.2.5 处理附件
        const assetsDir = getAssetsDir(problem.id);
        await fs.mkdir(assetsDir, { recursive: true });

        const assetEntries = zipEntries.filter(entry => 
          entry.startsWith(`${problemDir}assets/`) && !entry.endsWith('/')
        );

        for (const assetEntry of assetEntries) {
          const entry = zip.files[assetEntry];
          if (!entry) continue;

          const content = await entry.async('nodebuffer');
          const fileName = path.basename(assetEntry);
          await fs.writeFile(path.join(assetsDir, fileName), content);
        }

      } catch (error) {
        errors.push(`Error processing ${problemDir}: ${(error as Error).message}`);
      }
    }

    // 5. 返回导入结果
    return NextResponse.json({
      success: true,
      importedProblems,
      errors,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
