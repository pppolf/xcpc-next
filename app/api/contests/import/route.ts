import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { ClariCategory, ContestRole, ContestStatus, ContestType, Verdict } from '@/lib/generated/prisma/client';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'problems');

function getDataDir(problemId: number) {
  return path.join(UPLOAD_ROOT, problemId.toString(), 'data');
}

function getAssetsDir(problemId: number) {
  return path.join(UPLOAD_ROOT, problemId.toString(), 'assets');
}

interface ContestConfig {
  frozenDuration: number; // 封榜时长 (分钟)，0 表示不封榜
  unfreezeDelay: number;  // 多少小时后自动解榜
  medal: {
    mode: 'ratio' | 'fixed';
    gold: number;
    silver: number;
    bronze: number;
  }
}

interface ContestData {
  id?: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: ContestType;
  password?: string;
  status: ContestStatus;
  config?: ContestConfig;
}

interface UserData {
  id: string;
  username: string;
  password: string;
  plainPassword?: string;
  contestId: number;
  displayName?: string;
  members?: string;
  school?: string;
  seat?: string;
  coach?: string;
  category?: string;
  role: ContestRole;
}

interface ContestProblemData {
  id?: string;
  contestId: number;
  problemId: number;
  displayId: string;
  realTimeLimit?: number;
  realMemoryLimit?: number;
  color?: string;
}

interface SubmissionData {
  id: string;
  displayId: number;
  userId: string;
  problemId: number;
  language: string;
  code: string;
  codeLength: number;
  verdict: Verdict;
  timeUsed?: number;
  memoryUsed?: number;
  errorMessage?: string;
  passedTests: number;
  totalTests: number;
  submittedAt: string;
}

interface ClarificationData {
  id: number;
  contestId: number;
  displayId?: string;
  problemId?: number;
  userId?: string;
  title?: string;
  content: string;
  category: ClariCategory;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  replies: ReplyData[];
}

interface ReplyData {
  id: number;
  clarificationId: number;
  userId: string;
  content: string;
  createdAt: string;
}

interface BalloonData {
  id: number;
  submissionId: string;
  contestId: number;
  status: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
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

    const importedContests: { id: number; title: string }[] = [];
    const errors: string[] = [];

    // 4. 遍历ZIP文件内容
    const zipEntries = Object.keys(zip.files);
    const contestDirs = new Set<string>();

    // 4.1 收集所有比赛目录（包含contest.json的目录）
    for (const entry of zipEntries) {
      if (entry.endsWith('/')) {
        const possibleContestDir = entry;
        const contestJsonEntry = zip.files[`${possibleContestDir}contest.json`];
        if (contestJsonEntry) {
          contestDirs.add(possibleContestDir);
        }
      }
    }

    // 4.2 处理每个比赛目录
    for (const contestDir of contestDirs) {
      try {
        // 4.2.1 读取比赛信息
        const contestJsonEntry = zip.files[`${contestDir}contest.json`];
        if (!contestJsonEntry) {
          continue;
        }

        const contestJsonContent = await contestJsonEntry.async('text');
        const contestData = JSON.parse(contestJsonContent) as ContestData;

        // 4.2.2 读取其他比赛相关数据
        let usersData: UserData[] = [];
        let contestProblemsData: ContestProblemData[] = [];
        let submissionsData: SubmissionData[] = [];
        let clarificationsData: ClarificationData[] = [];
        let balloonsData: BalloonData[] = [];

        const usersJsonEntry = zip.files[`${contestDir}users.json`];
        if (usersJsonEntry) {
          const usersJsonContent = await usersJsonEntry.async('text');
          usersData = JSON.parse(usersJsonContent);
        }

        const contestProblemsJsonEntry = zip.files[`${contestDir}contest_problems.json`];
        if (contestProblemsJsonEntry) {
          const contestProblemsJsonContent = await contestProblemsJsonEntry.async('text');
          contestProblemsData = JSON.parse(contestProblemsJsonContent);
        }

        const submissionsJsonEntry = zip.files[`${contestDir}submissions.json`];
        if (submissionsJsonEntry) {
          const submissionsJsonContent = await submissionsJsonEntry.async('text');
          submissionsData = JSON.parse(submissionsJsonContent);
        }

        const clarificationsJsonEntry = zip.files[`${contestDir}clarifications.json`];
        if (clarificationsJsonEntry) {
          const clarificationsJsonContent = await clarificationsJsonEntry.async('text');
          clarificationsData = JSON.parse(clarificationsJsonContent);
        }

        const balloonsJsonEntry = zip.files[`${contestDir}balloons.json`];
        if (balloonsJsonEntry) {
          const balloonsJsonContent = await balloonsJsonEntry.async('text');
          balloonsData = JSON.parse(balloonsJsonContent);
        }

        // 4.2.3 导入题目数据
        const problemsDir = `${contestDir}problems/`;
        const problemDirs = new Set<string>();

        for (const entry of zipEntries) {
          if (entry.startsWith(problemsDir) && entry.endsWith('/') && entry !== problemsDir) {
            problemDirs.add(entry);
          }
        }

        for (const problemDir of problemDirs) {
          const problemJsonEntry = zip.files[`${problemDir}problem.json`];
          if (!problemJsonEntry) continue;

          const problemJsonContent = await problemJsonEntry.async('text');
          const problemData = JSON.parse(problemJsonContent) as ProblemData;

          // 检查题目是否已存在
          let problem = await prisma.problem.findUnique({
            where: { id: problemData.id },
          });

          if (!problem) {
            // 创建新题目
            problem = await prisma.problem.create({
              data: {
                id: problemData.id,
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
          } else {
            // 更新现有题目
            problem = await prisma.problem.update({
              where: { id: problemData.id },
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
          }

          // 导入题目数据文件
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

          // 导入题目附件
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
        }

        // 4.2.4 创建或更新比赛
        let contest = await prisma.contest.findUnique({
          where: { id: contestData.id },
        });

        if (contest) {
          // 更新现有比赛
          contest = await prisma.contest.update({
            where: { id: contestData.id },
            data: {
              title: contestData.title,
              description: contestData.description,
              startTime: new Date(contestData.startTime),
              endTime: new Date(contestData.endTime),
              type: contestData.type,
              password: contestData.password,
              status: contestData.status,
              config: contestData.config ? JSON.parse(JSON.stringify(contestData.config)) : undefined,
            },
          });
        } else {
          // 创建新比赛
          contest = await prisma.contest.create({
            data: {
              id: contestData.id,
              title: contestData.title,
              description: contestData.description,
              startTime: new Date(contestData.startTime),
              endTime: new Date(contestData.endTime),
              type: contestData.type,
              password: contestData.password,
              status: contestData.status,
              config: contestData.config ? JSON.parse(JSON.stringify(contestData.config)) : undefined,
            },
          });
        }

        importedContests.push({ id: contest.id, title: contest.title });

        // 4.2.5 导入用户
        for (const userData of usersData) {
          // 检查用户是否已存在
          const existingUser = await prisma.user.findFirst({
            where: {
              contestId: contest.id,
              username: userData.username,
            },
          });

          if (existingUser) {
            // 更新现有用户
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                password: userData.password,
                plainPassword: userData.plainPassword,
                displayName: userData.displayName,
                members: userData.members,
                school: userData.school,
                seat: userData.seat,
                coach: userData.coach,
                category: userData.category,
                role: userData.role,
              },
            });
          } else {
            // 创建新用户
            await prisma.user.create({
              data: {
                id: userData.id,
                username: userData.username,
                password: userData.password,
                plainPassword: userData.plainPassword,
                contestId: contest.id,
                displayName: userData.displayName,
                members: userData.members,
                school: userData.school,
                seat: userData.seat,
                coach: userData.coach,
                category: userData.category,
                role: userData.role,
              },
            });
          }
        }

        // 4.2.6 导入比赛题目关联
        for (const cpData of contestProblemsData) {
          // 检查题目是否存在
          const problem = await prisma.problem.findUnique({
            where: { id: cpData.problemId },
          });

          if (!problem) {
            errors.push(`Problem ${cpData.problemId} not found for contest ${contest.id}`);
            continue;
          }

          // 检查关联是否已存在
          const existingContestProblem = await prisma.contestProblem.findFirst({
            where: {
              contestId: contest.id,
              problemId: cpData.problemId,
            },
          });

          if (existingContestProblem) {
            // 更新现有关联
            await prisma.contestProblem.update({
              where: { id: existingContestProblem.id },
              data: {
                displayId: cpData.displayId,
                realTimeLimit: cpData.realTimeLimit,
                realMemoryLimit: cpData.realMemoryLimit,
                color: cpData.color,
              },
            });
          } else {
            // 创建新关联
            await prisma.contestProblem.create({
              data: {
                id: cpData.id,
                contestId: contest.id,
                problemId: cpData.problemId,
                displayId: cpData.displayId,
                realTimeLimit: cpData.realTimeLimit,
                realMemoryLimit: cpData.realMemoryLimit,
                color: cpData.color,
              },
            });
          }
        }

        // 4.2.7 导入提交记录
        for (const submissionData of submissionsData) {
          // 检查用户是否存在
          const user = await prisma.user.findFirst({
            where: {
              id: submissionData.userId,
              contestId: contest.id,
            },
          });

          if (!user) {
            continue;
          }

          // 检查题目是否存在
          const problem = await prisma.problem.findUnique({
            where: { id: submissionData.problemId },
          });

          if (!problem) {
            continue;
          }

          // 检查提交是否已存在
          const existingSubmission = await prisma.submission.findUnique({
            where: { id: submissionData.id },
          });

          if (existingSubmission) {
            // 更新现有提交
            await prisma.submission.update({
              where: { id: existingSubmission.id },
              data: {
                displayId: submissionData.displayId,
                verdict: submissionData.verdict,
                timeUsed: submissionData.timeUsed,
                memoryUsed: submissionData.memoryUsed,
                errorMessage: submissionData.errorMessage,
                passedTests: submissionData.passedTests,
                totalTests: submissionData.totalTests,
              },
            });
          } else {
            // 创建新提交
            await prisma.submission.create({
              data: {
                id: submissionData.id,
                displayId: submissionData.displayId,
                userId: submissionData.userId,
                problemId: submissionData.problemId,
                contestId: contest.id,
                language: submissionData.language,
                code: submissionData.code,
                codeLength: submissionData.codeLength,
                verdict: submissionData.verdict,
                timeUsed: submissionData.timeUsed,
                memoryUsed: submissionData.memoryUsed,
                errorMessage: submissionData.errorMessage,
                passedTests: submissionData.passedTests,
                totalTests: submissionData.totalTests,
                submittedAt: new Date(submissionData.submittedAt),
              },
            });
          }
        }

        // 4.2.8 导入答疑
        for (const clariData of clarificationsData) {
          // 检查答疑是否已存在
          const existingClari = await prisma.clarification.findUnique({
            where: { id: clariData.id },
          });

          let clarification;
          if (existingClari) {
            // 更新现有答疑
            clarification = await prisma.clarification.update({
              where: { id: clariData.id },
              data: {
                displayId: clariData.displayId,
                problemId: clariData.problemId,
                userId: clariData.userId,
                title: clariData.title,
                content: clariData.content,
                category: clariData.category,
                isPublic: clariData.isPublic,
              },
            });
          } else {
            // 创建新答疑
            clarification = await prisma.clarification.create({
              data: {
                id: clariData.id,
                contestId: contest.id,
                displayId: clariData.displayId,
                problemId: clariData.problemId,
                userId: clariData.userId,
                title: clariData.title,
                content: clariData.content,
                category: clariData.category,
                isPublic: clariData.isPublic,
              },
            });
          }

          // 导入回复
          for (const replyData of clariData.replies) {
            // 检查回复是否已存在
            const existingReply = await prisma.reply.findUnique({
              where: { id: replyData.id },
            });

            if (!existingReply) {
              // 创建新回复
              await prisma.reply.create({
                data: {
                  id: replyData.id,
                  clarificationId: clarification.id,
                  userId: replyData.userId,
                  content: replyData.content,
                  createdAt: new Date(replyData.createdAt),
                },
              });
            }
          }
        }

        // 4.2.9 导入气球
        for (const balloonData of balloonsData) {
          // 检查提交是否存在
          const submission = await prisma.submission.findUnique({
            where: { id: balloonData.submissionId },
          });

          if (!submission) {
            continue;
          }

          // 检查气球是否已存在
          const existingBalloon = await prisma.balloon.findUnique({
            where: { id: balloonData.id },
          });

          if (existingBalloon) {
            // 更新现有气球
            await prisma.balloon.update({
              where: { id: existingBalloon.id },
              data: {
                status: balloonData.status,
                assignedToId: balloonData.assignedToId,
              },
            });
          } else {
            // 创建新气球
            await prisma.balloon.create({
              data: {
                id: balloonData.id,
                submissionId: balloonData.submissionId,
                contestId: contest.id,
                status: balloonData.status,
                assignedToId: balloonData.assignedToId,
                createdAt: new Date(balloonData.createdAt),
                updatedAt: new Date(balloonData.updatedAt),
              },
            });
          }
        }

      } catch (error) {
        errors.push(`Error processing ${contestDir}: ${(error as Error).message}`);
      }
    }

    // 5. 返回导入结果
    return NextResponse.json({
      success: true,
      importedContests,
      errors,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
