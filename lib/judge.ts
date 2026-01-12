import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
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

// 定义 Redis 中缓存的数据结构
interface JudgeProgress {
  verdict: string;
  passedTests: number;
  totalTests: number;
  finished: boolean;
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
    compileCmd: [
      "/usr/bin/bash",
      "-c",
      "export PATH=$PATH:/usr/lib/jvm/java-21-openjdk-amd64/bin && /usr/lib/jvm/java-21-openjdk-amd64/bin/javac -d . -encoding utf8 ./Main.java && jar cvf Main.jar *.class >/dev/null",
    ],
    runCmd: [
      "/usr/lib/jvm/java-21-openjdk-amd64/bin/java",
      "-Dfile.encoding='UTF-8'",
      "-cp",
      "Main.jar",
      "Main",
    ],
  },
  pypy3: {
    srcName: "main.py",
    exeName: "main.py",
    runCmd: ["/usr/bin/pypy3", "main.py"],
  },
};

// 调用 go-judge 的 /run 接口
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callGoJudge(payload: any) {
  const res = await fetch(`${GO_JUDGE_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Judge Server Error: ${res.statusText}`);
  return res.json();
}

async function deleteTmpFile(id: string) {
  const res = await fetch(`${GO_JUDGE_URL}/file/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Judge Server Error: ${res.statusText}`);
  return res;
}

// 清理文本 (去除末尾空白) 用于比对
function cleanOutput(str: string) {
  if (!str) return "";
  return str.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// 辅助：更新进度到 Redis
async function updateProgress(submissionId: string, data: JudgeProgress) {
  const key = `submission:${submissionId}:progress`;
  // 存入 Redis，设置过期时间 (例如 1 小时后自动过期)
  await redis.set(key, JSON.stringify(data), "EX", 3600);
}

// 编译 SPJ Checker
async function compileChecker(dataDir: string, checkerName: string) {
  const checkerPath = path.join(dataDir, checkerName);
  let checkerCode = "";
  try {
    checkerCode = await fs.readFile(checkerPath, "utf-8");
  } catch (e) {
    console.log(e);
    throw new Error(`Checker file not found: ${checkerName}`);
  }

  const testlibPath = path.join(process.cwd(), "lib", "judge", "testlib.h");
  let testlibCode = "";
  try {
    testlibCode = await fs.readFile(testlibPath, "utf-8");
  } catch (e) {
    console.error("Missing testlib.h", e);
    throw new Error("System Error: testlib.h not found on server.");
  }

  // 使用 g++ 编译
  const compileRes = await callGoJudge({
    cmd: [
      {
        args: [
          "/usr/bin/g++",
          "checker.cpp",
          "-o",
          "checker",
          "-O2",
          "-std=c++23", // testlib 通常需要较新标准
        ],
        env: ["PATH=/usr/bin:/bin"],
        files: [
          { content: "", name: "stdout", max: 1000000 },
          { content: "", name: "stderr", max: 1000000 },
        ],
        cpuLimit: 10000000000,
        memoryLimit: 512 * 1024 * 1024,
        procLimit: 50,
        copyIn: {
          "checker.cpp": { content: checkerCode },
          "testlib.h": { content: testlibCode },
        },
        copyOutCached: ["checker"], // 缓存编译好的 checker
      },
    ],
  });

  if (compileRes[0].status !== "Accepted") {
    throw new Error(`Checker Compile Failed: ${compileRes}`);
  }

  return compileRes[0].fileIds["checker"];
}

// --- 核心判题逻辑 ---
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

    // 【修改点 1】初始化 Redis 状态
    await updateProgress(submissionId, {
      verdict: Verdict.JUDGING,
      passedTests: 0,
      totalTests: testCases.length,
      finished: false,
    });

    // C. 编译阶段 (如果需要)
    let executableFileId = "";
    let checkerFileId = "";
    if (langConfig.compileCmd) {
      const compileRes = await callGoJudge({
        cmd: [
          {
            args: langConfig.compileCmd,
            env: [
              "PATH=/usr/bin:/bin:/usr/lib/jvm/java-21-openjdk-amd64/bin", // 把 Java bin 路径加进去
              "LANG=en_US.UTF-8",
              "LC_ALL=en_US.UTF-8",
              "JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64", // 显式设置 JAVA_HOME
            ],
            files: [
              {
                content: "",
              },
              {
                name: "stdout",
                max: 1000000,
              },
              {
                name: "stderr",
                max: 1000000,
              },
            ],
            cpuLimit: 10000000000, // 10s 编译时间
            memoryLimit: 1024 * 1024 * 1024, // 1G 编译内存
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
    const isSpj = problem.type === "spj";

    if (isSpj && judgeConfig.checker) {
      try {
        checkerFileId = await compileChecker(dataDir, judgeConfig.checker);
      } catch (e) {
        const err = e as Error;
        await prisma.submission.update({
          where: { id: submissionId },
          data: { verdict: Verdict.SYSTEM_ERROR, errorMessage: err.message },
        });
        await redis.del(`submission:${submissionId}:progress`);
        return;
      }
    }

    // D. 运行阶段 (并发跑所有测试点)
    // 构造 go-judge 的请求数组
    const time_limit_rate: Record<string, number> = {
      c: judgeConfig.time_limit_rate?.c || 1,
      cpp: judgeConfig.time_limit_rate?.cpp || 1,
      java: judgeConfig.time_limit_rate?.java || 2,
      pypy3: judgeConfig.time_limit_rate?.pypy3 || 1,
    };

    const memory_limit_rate: Record<string, number> = {
      c: judgeConfig.memory_limit_rate?.c || 1,
      cpp: judgeConfig.memory_limit_rate?.cpp || 1,
      java: judgeConfig.memory_limit_rate?.java || 2,
      pypy3: judgeConfig.memory_limit_rate?.pypy3 || 1,
    };
    let finalVerdict: Verdict = Verdict.ACCEPTED;
    let maxTime = 0;
    let maxMemory = 0;
    let error = "";
    let idx = 0;
    for (let i = 0; i < testCases.length; i++) {
      idx += 1;
      const testCase = testCases[i];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cmdObj: any = {
        args: langConfig.runCmd,
        env: [
          "PATH=/usr/bin:/bin:/usr/lib/jvm/java-21-openjdk-amd64/bin",
          "LANG=en_US.UTF-8",
          "JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64",
        ],
        files: [
          { content: testCase.in }, // stdin
          { name: "stdout", max: 1000000 }, // stdout
          { name: "stderr", max: 1000000 }, // stderr
        ],
        cpuLimit:
          problem.defaultTimeLimit * 1000000 * time_limit_rate[language], // ns (1ms = 1,000,000ns)
        memoryLimit:
          problem.defaultMemoryLimit *
          1024 *
          1024 *
          memory_limit_rate[language], // byte
        procLimit: 50,
      };

      if (executableFileId) {
        cmdObj.copyIn = {
          [langConfig.exeName]: { fileId: executableFileId },
        };
      } else {
        cmdObj.copyIn = {
          [langConfig.srcName]: { content: code },
        };
      }

      const runResults = await callGoJudge({ cmd: [cmdObj] });
      const res = runResults[0]; // 拿到结果

      // 统计时间和内存 (转为 ms 和 KB)
      const timeMs = Math.floor(res.time / 1000000);
      const memoryKB = Math.floor(res.memory / 1024);
      maxTime = Math.max(maxTime, timeMs);
      maxMemory = Math.max(maxMemory, memoryKB);
      // 系统/运行状态检查
      if (res.status !== "Accepted") {
        if (res.status === "Time Limit Exceeded") {
          finalVerdict = Verdict.TIME_LIMIT_EXCEEDED;
        } else if (res.status === "Memory Limit Exceeded") {
          finalVerdict = Verdict.MEMORY_LIMIT_EXCEEDED;
        } else {
          finalVerdict = Verdict.RUNTIME_ERROR;
        }
        error = res.files?.stderr || "Unkown Error";
        break;
      }

      // 答案比对
      const userOutput = cleanOutput(res.files?.stdout || "");

      // SPJ
      if (isSpj) {
        const checkerRes = await callGoJudge({
          cmd: [
            {
              args: ["./checker", "input.in", "user.out", "answer.out"],
              env: ["PATH=/usr/bin:/bin"],
              files: [
                { content: "", name: "stdout", max: 1000000 }, // Checker 的输出通常是 xml 或 text
                { content: "", name: "stderr", max: 1000000 }, // Checker 的错误信息
              ],
              cpuLimit: 10000 * 1000000, // 给 Checker 充足时间 (e.g. 10s)
              memoryLimit: 512 * 1024 * 1024,
              procLimit: 50,
              copyIn: {
                checker: { fileId: checkerFileId }, // 挂载编译好的 checker
                "input.in": { content: testCase.in },
                "user.out": { content: userOutput },
                "answer.out": { content: testCase.out },
              },
            },
          ],
        });
        const chkResult = checkerRes[0];
        if (chkResult.exitStatus === 0) {
          // AC
        } else {
          // 非 0 为 WA (Testlib: 1=WA, 2=PE, 3=Fail)
          finalVerdict = Verdict.WRONG_ANSWER;
          // 可选：读取 checker 的 stderr 作为错误信息展示给用户或管理员
          error = chkResult.files?.stderr || "SPJ check failed";
          break;
        }
      } else {
        const stdOutput = cleanOutput(testCase.out);
        if (userOutput !== stdOutput) {
          finalVerdict = Verdict.WRONG_ANSWER;
          break;
        }
      }

      await updateProgress(submissionId, {
        verdict: Verdict.JUDGING,
        passedTests: i + 1,
        totalTests: testCases.length,
        finished: false,
      });

      // await prisma.submission.update({
      //   where: { id: submissionId },
      //   data: {
      //     passedTests: i + 1,
      //     timeUsed: maxTime,
      //     memoryUsed: maxMemory,
      //   },
      // });

      // await delay(10000);
    }
    await updateProgress(submissionId, {
      verdict: finalVerdict,
      passedTests: idx - 1,
      totalTests: testCases.length,
      finished: true,
    });
    // F. 更新数据库
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: finalVerdict,
        timeUsed: maxTime,
        memoryUsed: maxMemory,
        errorMessage: error,
        passedTests: idx - 1,
        totalTests: testCases.length,
      },
    });

    // 删除编译文件
    if (executableFileId) {
      deleteTmpFile(executableFileId);
    }
    if (checkerFileId) {
      deleteTmpFile(checkerFileId);
    }
  } catch (error) {
    console.error("Judge Error:", error);
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: Verdict.SYSTEM_ERROR,
        errorMessage: error || "Unknown System Error",
      },
    });
    await redis.del(`submission:${submissionId}:progress`);
  }
}
