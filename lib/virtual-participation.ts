import { ContestStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type VpContestConfig = {
  vpEnabled?: boolean;
  vpDurationMinutes?: number;
};

export function isVpEnabled(config: unknown) {
  const vpConfig = (config || {}) as VpContestConfig;
  return vpConfig.vpEnabled !== false;
}

export function getVpDurationMinutes(contest: {
  startTime: Date;
  endTime: Date;
  config: unknown;
}) {
  const config = (contest.config || {}) as VpContestConfig;
  const configuredDuration = Number(config.vpDurationMinutes || 0);
  if (Number.isFinite(configuredDuration) && configuredDuration > 0) {
    return Math.floor(configuredDuration);
  }

  return Math.max(
    1,
    Math.ceil((contest.endTime.getTime() - contest.startTime.getTime()) / 60000),
  );
}

export async function getLatestVirtualParticipation(
  contestId: number,
  globalUserId: string,
) {
  return prisma.virtualParticipation.findFirst({
    where: { contestId, globalUserId },
    orderBy: [{ attemptNo: "desc" }, { startedAt: "desc" }],
  });
}

export async function getRunningVirtualParticipation(
  contestId: number,
  globalUserId: string,
  now = new Date(),
) {
  return prisma.virtualParticipation.findFirst({
    where: {
      contestId,
      globalUserId,
      status: "RUNNING",
      startedAt: { lte: now },
      endedAt: { gte: now },
    },
    orderBy: [{ attemptNo: "desc" }, { startedAt: "desc" }],
  });
}

export async function startVirtualParticipation(
  contestId: number,
  globalUserId: string,
) {
  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      config: true,
    },
  });

  if (!contest) {
    throw new Error("Contest not found.");
  }

  const now = new Date();
  const contestEnded =
    contest.status === ContestStatus.ENDED || now >= contest.endTime;
  if (!contestEnded) {
    throw new Error("Virtual participation is available after the contest ends.");
  }

  if (!isVpEnabled(contest.config)) {
    throw new Error("Virtual participation is not enabled for this contest.");
  }

  const latest = await getLatestVirtualParticipation(contestId, globalUserId);
  const nextAttemptNo = (latest?.attemptNo || 0) + 1;
  const durationMinutes = getVpDurationMinutes(contest);
  const endedAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  if (latest?.status === "RUNNING" && latest.endedAt > now) {
    await prisma.virtualParticipation.update({
      where: { id: latest.id },
      data: { status: "FINISHED", finishedAt: now },
    });
  }

  return prisma.virtualParticipation.create({
    data: {
      contestId,
      globalUserId,
      attemptNo: nextAttemptNo,
      startedAt: now,
      endedAt,
      status: "RUNNING",
    },
  });
}

export async function getLatestVirtualParticipationsForContest(
  contestId: number,
) {
  const participations = await prisma.virtualParticipation.findMany({
    where: { contestId },
    include: {
      globalUser: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
      submissions: {
        select: {
          id: true,
          displayId: true,
          problemId: true,
          verdict: true,
          submittedAt: true,
        },
        orderBy: { submittedAt: "asc" },
      },
    },
    orderBy: [{ globalUserId: "asc" }, { attemptNo: "desc" }],
  });

  const latestByUser = new Map<string, (typeof participations)[number]>();
  for (const vp of participations) {
    if (!latestByUser.has(vp.globalUserId)) {
      latestByUser.set(vp.globalUserId, vp);
    }
  }

  return Array.from(latestByUser.values());
}
