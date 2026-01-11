import { prisma } from "@/lib/prisma";
import path from "path";
import { promises as fs } from "fs";
import { Verdict } from "@/lib/generated/prisma/enums";

const GO_JUDGE_URL = process.env.GO_JUDGE_API || "http://localhost:5050";

// 语言配置
interface LanguageConfig {
  srcName: string;
  exeName: string;
  compileCmd?: string[]; // 编译命令 (Python/JS 不需要)
  runCmd: string[]; // 运行命令
}

interface LanguageJudgeConfig {
  java?: number;
  pypy3?: number;
  c?: number;
  cpp?: number;
}

interface TestCaseConfig {
  input: string; // e.g. "1.in"
  output: string; // e.g. "1.out"
}

interface JudgeConfig {
  cases?: TestCaseConfig[];
  checker?: string;
  interactor?: string;
  time_limit_rate?: LanguageJudgeConfig;
  memory_limit_rate?: LanguageJudgeConfig;
}

const LANGUAGES: Record<string, LanguageConfig> = {
  c: {
    srcName: "main.c",
    exeName: "main",
    compileCmd: [
      "/usr/bin/gcc",
      "main.c",
      "-o",
      "main",
      "-O2",
      "-Wall",
      "-lm",
      "-static",
      "-std=c11",
    ],
    runCmd: ["./main"],
  },
  cpp: {
    srcName: "main.cpp",
    exeName: "main",
    compileCmd: [
      "/usr/bin/g++",
      "main.cpp",
      "-o",
      "main",
      "-O2",
      "-Wall",
      "-lm",
      "-static",
      "-std=c++23",
    ],
    runCmd: ["./main"],
  },
  java: {
    srcName: "Main.java",
    exeName: "Main.jar",
    compileCmd: ["/usr/bin/javac", "Main.java", "-encoding", "UTF-8"], // 简单起见，实际可能需要打包 jar
    runCmd: ["/usr/bin/java", "Main"], // 这里的运行环境需要仔细配置 classpath
  },
  pypy3: {
    srcName: "main.py",
    exeName: "main.py",
    runCmd: ["/usr/bin/pypy3", "main.py"],
  },
};

// 调用 go-judge 的 /run 接口
async function callGoJudge(payload: any) {
  const res = await fetch(`${GO_JUDGE_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Judge Server Error: ${res.statusText}`);
  return res.json();
}

// 清理文本 (去除末尾空白) 用于比对
function cleanOutput(str: string) {
  if (!str) return "";
  return str.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// --- 3. 核心判题逻辑 ---
export async function judgeSubmission(submissionId: string) {
  // A. 获取提交记录和题目信息
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { problem: true },
  });

  if (!submission) return;

  // 更新状态为 JUDGING
  await prisma.submission.update({
    where: { id: submissionId },
    data: { verdict: Verdict.JUDGING },
  });

  try {
    const { language, code, problem } = submission;
    const langConfig = LANGUAGES[language];
    if (!langConfig) throw new Error(`Unsupported Language: ${language}`);

    const judgeConfig = problem.judgeConfig as unknown as JudgeConfig;

    if (!judgeConfig || !judgeConfig.cases || judgeConfig.cases.length === 0) {
      throw new Error("No judge configuration or test cases found.");
    }

    const dataDir = path.join(
      process.cwd(),
      "uploads",
      "problems",
      problem.id.toString(),
      "data"
    );

    // 配对输入输出
    const testCases: { in: string; out: string }[] = [];
    for (const caseItem of judgeConfig.cases) {
      const inputPath = path.join(dataDir, caseItem.input);
      const outputPath = path.join(dataDir, caseItem.output);

      // 检查文件是否存在并读取
      try {
        const inputContent = await fs.readFile(inputPath, "utf-8");
        const outputContent = await fs.readFile(outputPath, "utf-8");

        testCases.push({
          in: inputContent,
          out: outputContent,
        });
      } catch (err) {
        console.error(
          `Error reading test case files: ${caseItem.input} / ${caseItem.output}`,
          err
        );
        throw new Error(`Missing data files for case: ${caseItem.input}`);
      }
    }

    // C. 编译阶段 (如果需要)
    let executableFileId = "";

    if (langConfig.compileCmd) {
      const compileRes = await callGoJudge({
        cmd: [
          {
            args: langConfig.compileCmd,
            env: ["PATH=/usr/bin:/bin"],
            files: [
              {
                content: "",
              },
              {
                name: "stdout",
                max: 10240,
              },
              {
                name: "stderr",
                max: 10240,
              },
            ],
            cpuLimit: 10000000000, // 10s 编译时间
            memoryLimit: 512 * 1024 * 1024, // 512MB 编译内存
            procLimit: 50,
            copyIn: {
              [langConfig.srcName]: {
                content: code,
              },
            },
            copyOut: ["stdout", "stderr"],
            copyOutCached: [langConfig.exeName], // 缓存编译产物
          },
        ],
      });

      // 检查编译结果
      const result = compileRes[0];
      if (result.status !== "Accepted") {
        // 编译错误
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            verdict: Verdict.COMPILE_ERROR,
            errorMessage: result.files?.stderr || "Compilation Failed",
          },
        });
        return;
      }
      // 获取缓存的可执行文件 ID
      if (result.fileIds && result.fileIds[langConfig.exeName]) {
        executableFileId = result.fileIds[langConfig.exeName];
      } else {
        // C++/C 编译后通常是生成文件，如果没有 fileIds 说明编译可能没生成目标文件
        // 这里是一个简化的处理，实际可能需要更严谨的检查
      }
    }

    // D. 运行阶段 (并发跑所有测试点)
    // 构造 go-judge 的请求数组

    const time_limit_rate: Record<string, number> = {
      c: judgeConfig.time_limit_rate?.c || 1,
      cpp: judgeConfig.time_limit_rate?.cpp || 1,
      java: judgeConfig.time_limit_rate?.java || 1,
      pypy3: judgeConfig.time_limit_rate?.pypy3 || 1,
    };

    const memory_limit_rate: Record<string, number> = {
      c: judgeConfig.memory_limit_rate?.c || 1,
      cpp: judgeConfig.memory_limit_rate?.cpp || 1,
      java: judgeConfig.memory_limit_rate?.java || 1,
      pypy3: judgeConfig.memory_limit_rate?.pypy3 || 1,
    };

    const runCmds = testCases.map((testCase) => {
      const cmdObj: any = {
        args: langConfig.runCmd,
        env: ["PATH=/usr/bin:/bin"],
        files: [
          { content: testCase.in }, // stdin
          { name: "stdout", max: 10240 }, // stdout
          { name: "stderr", max: 10240 }, // stderr
        ],
        cpuLimit: problem.defaultTimeLimit * 100000 * time_limit_rate[language], // ns (1ms = 1,000,000ns)
        memoryLimit:
          problem.defaultMemoryLimit *
          1024 *
          1024 *
          memory_limit_rate[language], // byte
        procLimit: 50,
      };

      // 如果有编译产物，使用 copyInCached 挂载进来
      if (executableFileId) {
        cmdObj.copyIn = {
          [langConfig.exeName]: { fileId: executableFileId },
        };
      } else {
        // 解释型语言 (Python) 直接把源码放进去
        cmdObj.copyIn = {
          [langConfig.srcName]: { content: code },
        };
      }
      return cmdObj;
    });

    const runResults = await callGoJudge({ cmd: runCmds });

    // E. 结果判定
    let finalVerdict: Verdict = Verdict.ACCEPTED;
    let maxTime = 0;
    let maxMemory = 0;

    for (let i = 0; i < runResults.length; i++) {
      const res = runResults[i];
      const expectedOut = testCases[i].out;

      // 统计时间和内存 (转为 ms 和 KB)
      const timeMs = Math.floor(res.time / 1000000);
      const memoryKB = Math.floor(res.memory / 1024);
      if (timeMs > maxTime) maxTime = timeMs;
      if (memoryKB > maxMemory) maxMemory = memoryKB;

      // 1. 系统/运行状态检查
      if (res.status !== "Accepted") {
        if (res.status === "Time Limit Exceeded") {
          finalVerdict = Verdict.TIME_LIMIT_EXCEEDED;
        } else if (res.status === "Memory Limit Exceeded") {
          finalVerdict = Verdict.MEMORY_LIMIT_EXCEEDED;
        } else {
          finalVerdict = Verdict.RUNTIME_ERROR;
        }
        break;
      }

      // 2. 答案比对 (默认去除尾部空白)
      // TODO: 如果是 SPJ，这里需要修改逻辑调用 checker
      const userOutput = cleanOutput(res.files?.stdout || "");
      const stdOutput = cleanOutput(expectedOut);

      if (userOutput !== stdOutput) {
        finalVerdict = Verdict.WRONG_ANSWER;
        break;
      }
    }

    // F. 更新数据库
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: finalVerdict,
        timeUsed: maxTime,
        memoryUsed: maxMemory,
      },
    });
  } catch (error) {
    console.error("Judge Error:", error);
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: Verdict.SYSTEM_ERROR,
        errorMessage: error || "Unknown System Error",
      },
    });
  }
}
