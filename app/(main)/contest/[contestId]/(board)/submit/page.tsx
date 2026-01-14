import { notFound } from "next/navigation";
import ProblemInfoCard from "@/components/ProblemInfoCard";
import { prisma } from "@/lib/prisma";
import SubmitForm from "./client";

interface Props {
  searchParams: Promise<{ problem?: string }>;
  params: Promise<{ contestId: string }>;
}

export default async function SubmitPage({ params, searchParams }: Props) {
  const { contestId } = await params;
  const { problem: displayId } = await searchParams;
  if (!displayId) return notFound();

  const cid = Number(contestId);
  const contestProblem = await prisma.contestProblem.findFirst({
    where: { contestId: cid, displayId },
    include: { problem: true },
  });
  if (!contestProblem) return notFound();
  const { problem } = contestProblem;

  const [totalStats, acStats] = await Promise.all([
    prisma.submission.count({
      where: { contestId: cid, problemId: problem.id },
    }),
    prisma.submission.count({
      where: { contestId: cid, problemId: problem.id, verdict: "ACCEPTED" },
    }),
  ]);

  const info = {
    timeLimit: problem.defaultTimeLimit,
    memoryLimit: problem.defaultMemoryLimit,
    submissions: totalStats,
    accepted: acStats,
  };

  return (
    <div className="flex flex-col min-w-7xl max-w-7xl lg:flex-row gap-6 items-start">
      <aside>
        <ProblemInfoCard
          contestId={contestId}
          problemId={displayId}
          info={info}
          type="submit"
        />
      </aside>

      <SubmitForm contestId={contestId} problemId={displayId} />
    </div>
  );
}
