import { cookies } from "next/headers";
import { ContestRole, ContestStatus } from "@/lib/generated/prisma/client";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SubmissionProgress = {
  verdict: string;
  passedTests: number;
  totalTests: number;
};

export function hideSubmissionProgress<T extends SubmissionProgress>(
  progress: T,
): T {
  return {
    ...progress,
    passedTests: 0,
    totalTests: 0,
  };
}

export async function canViewSubmissionTestDetails(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      contestId: true,
      contest: {
        select: {
          status: true,
        },
      },
    },
  });

  if (
    !submission?.contestId ||
    submission.contest?.status !== ContestStatus.RUNNING
  ) {
    return true;
  }

  const cookieStore = await cookies();
  const superAdminToken = cookieStore.get("auth_token")?.value;

  if (superAdminToken) {
    try {
      const superAdminPayload = await verifyAuth(superAdminToken);
      if (superAdminPayload?.isGlobalAdmin) {
        return true;
      }
    } catch {
      // Ignore invalid admin cookies and fall through to contest-role checks.
    }
  }

  const userToken = cookieStore.get("user_token")?.value;
  if (!userToken) {
    return false;
  }

  try {
    const payload = await verifyAuth(userToken);
    if (!payload?.userId) {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        contestId: true,
        role: true,
      },
    });

    return (
      user?.contestId === submission.contestId &&
      (user.role === ContestRole.ADMIN || user.role === ContestRole.JUDGE)
    );
  } catch {
    return false;
  }
}
