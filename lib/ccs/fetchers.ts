import { prisma } from "@/lib/prisma";
import { ContestConfig } from "@/app/(main)/page";
import {
  toISO8601,
  formatDurationFromMinutes,
  toCCSVerdict,
  getRelativeTime,
} from "./utils";

export async function getContest(id: number) {
  const contest = await prisma.contest.findUnique({
    where: { id },
  });

  if (!contest) return null;

  const startTime = contest.startTime;
  const endTime = contest.endTime;
  const durationMs = endTime.getTime() - startTime.getTime();

  // Format duration as H:MM:SS.mmm
  const seconds = Math.floor(durationMs / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const duration = `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.000`;

  const config = (contest.config as unknown as ContestConfig) || {};
  const freezeDuration = formatDurationFromMinutes(config.frozenDuration || 0);
  const penalty = 20;

  return {
    id: contest.id.toString(),
    name: contest.title,
    formal_name: contest.title,
    start_time: toISO8601(startTime),
    end_time: toISO8601(endTime),
    duration: duration,
    scoreboard_freeze_duration: freezeDuration,
    penalty_time: penalty,
  };
}

export async function getContestState(id: number) {
  const contest = await prisma.contest.findUnique({
    where: { id },
  });

  if (!contest) return null;

  const startTime = contest.startTime;
  const endTime = contest.endTime;
  const config = (contest.config as unknown as ContestConfig) || {};

  const frozenDuration = config.frozenDuration || 0; // minutes
  const unfreezeDelay = config.unfreezeDelay || 300; // minutes

  let frozenTime = null;
  let thawedTime = null;

  if (frozenDuration > 0) {
    frozenTime = new Date(endTime.getTime() - frozenDuration * 60 * 1000);
    thawedTime = new Date(endTime.getTime() + unfreezeDelay * 60 * 1000);
  }

  const now = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state: any = {
    started: now >= startTime ? toISO8601(startTime) : null,
    ended: now >= endTime ? toISO8601(endTime) : null,
    finalized: null,
    end_of_updates: null,
  };

  if (frozenTime && now >= frozenTime) {
    state.frozen = toISO8601(frozenTime);
  }

  if (thawedTime && now >= thawedTime) {
    state.thawed = toISO8601(thawedTime);
  }

  return state;
}

export async function getTeams(contestId: number) {
  const teams = await prisma.user.findMany({
    where: {
      contestId,
      role: "TEAM",
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      category: true,
      school: true,
    },
  });

  return teams.map((team) => ({
    id: team.username,
    label: team.username,
    name:
      String(team.category === "1" ? "⭐" : "") + team.displayName ||
      team.username,
    group_ids: team.category ? [team.category] : [],
    organization_id: team.school || null,
  }));
}

export async function getOrganizations(contestId: number) {
  const organizations = await prisma.user.groupBy({
    by: ["school"],
    where: {
      contestId,
      role: "TEAM",
      school: { not: null },
    },
  });

  return organizations.map((o) => ({
    id: o.school!,
    name: o.school!,
    formal_name: o.school!,
    country: null,
  }));
}

export async function getGroups(contestId: number) {
  const groups = await prisma.user.groupBy({
    by: ["category"],
    where: {
      contestId,
      role: "TEAM",
      category: { not: null },
    },
  });

  const CATEGORY_MAP: Record<string, string> = {
    "0": "正式队伍",
    "1": "打星队伍",
    "2": "女生队伍",
  };

  return groups.map((g) => ({
    id: g.category!,
    name: CATEGORY_MAP[g.category!] || g.category!,
  }));
}

export async function getProblems(contestId: number) {
  const problems = await prisma.contestProblem.findMany({
    where: {
      contestId,
    },
    include: {
      problem: true,
    },
    orderBy: {
      displayId: "asc",
    },
  });

  return problems.map((cp, index) => {
    // Parse test_data_count from problem.judgeConfig (if available) or samples
    let testDataCount = 0;

    // Attempt 1: Try to read from judgeConfig (YAML parsed into JSON)
    // The structure might vary, but let's assume standard 'testcases' or similar
    if (cp.problem.judgeConfig) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = cp.problem.judgeConfig as any;
      if (Array.isArray(config.testcases)) {
        testDataCount = config.testcases.length;
      }
    }

    // Attempt 2: If no judgeConfig or 0, fallback to a default safe value or 0
    // ICPC Live needs this to know the max ordinal.
    // If we return 0, it might ignore runs.
    // If we return a large number (e.g. 100), it might show a long empty bar.
    // Ideally we should know the real count.

    // For now, if 0, let's default to a reasonable number if we can't find it,
    // or keep 0 if we really don't know.
    // But user says: "Must be between 1 and problem:test_data_count" for ordinals.
    // So if we emit ordinals 1..N, test_data_count MUST be >= N.
    // Since we don't know N for every submission ahead of time (it depends on test cases),
    // we should probably set this to the maximum possible test cases for this problem.

    if (testDataCount === 0) {
      testDataCount = 100; // Fallback to a high number to allow ordinals up to 100
    }

    return {
      id: cp.problemId.toString(),
      label: cp.displayId,
      name: cp.problem.title,
      ordinal: index,
      time_limit: (cp.realTimeLimit || cp.problem.defaultTimeLimit) / 1000,
      test_data_count: testDataCount,
      rgb: cp.color || null,
    };
  });
}

export async function getLanguages(contestId: number) {
  const languages = await prisma.submission.groupBy({
    by: ["language"],
    where: {
      contestId,
    },
  });

  if (languages.length === 0) {
    return [
      { id: "c", name: "C" },
      { id: "cpp", name: "C++" },
      { id: "java", name: "Java" },
      { id: "python", name: "Python" },
    ];
  }

  return languages.map((l) => ({
    id: l.language,
    name: l.language,
    entry_point_required: false,
    entry_point_name: null,
  }));
}

export async function getSubmissions(contestId: number) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return [];

  const submissions = await prisma.submission.findMany({
    where: {
      contestId,
    },
    include: {
      user: true,
      problem: true,
    },
    orderBy: {
      submittedAt: "asc",
    },
  });

  return submissions.map((sub) => ({
    id: sub.id,
    team_id: sub.user?.username || sub.userId,
    problem_id: sub.problemId.toString(),
    language_id: sub.language,
    time: toISO8601(sub.submittedAt),
    contest_time: getRelativeTime(contest.startTime, sub.submittedAt),
    files: [],
  }));
}

export async function getJudgements(contestId: number) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return [];

  const submissions = await prisma.submission.findMany({
    where: {
      contestId,
    },
    include: {
      user: true,
      problem: true,
    },
    orderBy: {
      submittedAt: "asc",
    },
  });

  return submissions
    .map((sub) => {
      // If verdict is pending, return null or handle appropriately?
      // CCS spec says judgements are created when judging starts.
      // If it's PENDING, maybe we shouldn't return a judgement yet unless we want to show it in queue.
      // But usually 'submissions' puts it in queue?
      // Actually, CCS says: Submission -> Judgement (start) -> Runs -> Judgement (end)
      // So if we have a submission, we should have a judgement if it's being judged.

      if (sub.verdict === "PENDING") return null;

      const verdict = toCCSVerdict(sub.verdict);
      // If verdict is null (e.g. JUDGING), we still want to return a judgement with no end_time

      const startTime = sub.submittedAt;
      let endTime = null;
      let judgementTypeId = null;

      if (verdict) {
        // Finished judging
        endTime = sub.timeUsed
          ? new Date(startTime.getTime() + sub.timeUsed)
          : startTime;
        judgementTypeId = verdict;
      } else if (sub.verdict === "JUDGING") {
        // Currently judging
        endTime = null;
        judgementTypeId = null;
      } else {
        // PENDING or other ignored states
        return null;
      }

      return {
        id: sub.id,
        submission_id: sub.id,
        judgement_type_id: judgementTypeId,
        start_time: toISO8601(startTime),
        end_time: endTime ? toISO8601(endTime) : null,
        start_contest_time: getRelativeTime(contest.startTime, startTime),
        end_contest_time: endTime
          ? getRelativeTime(contest.startTime, endTime)
          : null,
      };
    })
    .filter(Boolean);
}

export async function getRuns(contestId: number) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return [];

  const submissions = await prisma.submission.findMany({
    where: {
      contestId,
      verdict: {
        not: "PENDING", // Only return runs for things that started judging
      },
    },
    include: {
      user: true,
      problem: true,
    },
    orderBy: {
      submittedAt: "asc",
    },
  });

  // Flatten submissions into runs
  // Scheme:
  // 1. For each passed test (1..passedTests), generate an 'AC' run.
  // 2. If verdict is not AC and not judging/pending (e.g. WA/TLE), append one final run with that verdict.
  //    (We don't know exactly which test failed, but we assume it's the next one)

  // Note: This is a simulation because we don't store individual runs in DB yet.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allRuns: any[] = [];

  submissions.forEach((sub) => {
    const verdict = toCCSVerdict(sub.verdict);

    // Generate AC runs for passed tests
    for (let i = 1; i <= sub.passedTests; i++) {
      allRuns.push({
        id: `${sub.id}-${i}`,
        judgement_id: sub.id,
        ordinal: i,
        judgement_type_id: "AC",
        time: toISO8601(sub.submittedAt), // Ideally should be slightly later, but we lack data
        contest_time: getRelativeTime(contest.startTime, sub.submittedAt),
        team_id: sub.user?.username || sub.userId,
        problem_id: sub.problemId.toString(),
        language_id: sub.language,
      });
    }

    // If finished and not AC, add the failing run
    if (verdict && verdict !== "AC") {
      const failOrdinal = sub.passedTests + 1;
      allRuns.push({
        id: `${sub.id}-${failOrdinal}`,
        judgement_id: sub.id,
        ordinal: failOrdinal,
        judgement_type_id: verdict,
        time: toISO8601(sub.submittedAt),
        contest_time: getRelativeTime(contest.startTime, sub.submittedAt),
        team_id: sub.user?.username || sub.userId,
        problem_id: sub.problemId.toString(),
        language_id: sub.language,
      });
    }
  });

  return allRuns;
}

export async function getSubmissionStates(contestId: number) {
  return await prisma.submission.findMany({
    where: { contestId },
    select: {
      id: true,
      verdict: true,
      passedTests: true,
      submittedAt: true,
      userId: true,
      user: {
        select: {
          username: true,
        },
      },
      problemId: true,
      language: true,
      timeUsed: true,
    },
    orderBy: { submittedAt: "asc" },
  });
}
