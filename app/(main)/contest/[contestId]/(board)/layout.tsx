import { Contest, ContestConfig } from "@/app/(main)/page";
import ContestTimer from "@/components/ContestTimer";
import { prisma } from "@/lib/prisma";

interface Props {
  children: React.ReactNode;
  params: Promise<{
    contestId: string;
  }>;
}

export default async function ContestLayout({ children, params }: Props) {
  const { contestId } = await params;

  const contest: Contest | null = await prisma.contest.findUnique({
    where: { id: Number(contestId) },
  });

  if (!contest) return <div>Contest not found</div>;
  const frozenDuration = Number((contest.config as ContestConfig)?.frozenDuration || 0);

  return (
    <div className="space-y-6">
      <div className="bg-white min-w-300 shadow-sm border border-gray-100 rounded-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
              {contest.title}
            </h1>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>
                ID:{" "}
                <span className="font-mono text-gray-700">{contest.id}</span>
              </span>
              <span>
                Type:{" "}
                <span className="font-bold text-blue-700">{contest.type}</span>
              </span>
              <span>
                Status:{" "}
                <span className="font-bold text-red-600">{contest.status}</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase">Ends At</div>
            <div className="text-gray-800 font-mono">
              {contest.endTime.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6 w-full">
          <ContestTimer
            startTime={contest.startTime}
            endTime={contest.endTime}
            frozenDuration={frozenDuration}
          />
        </div>
      </div>
      <div className="min-h-125">{children}</div>
    </div>
  );
}
