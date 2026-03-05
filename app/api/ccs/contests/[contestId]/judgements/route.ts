import { NextRequest, NextResponse } from "next/server";
import { checkCCSAuth, unauthorizedResponse } from "@/lib/ccs/auth";
import { getJudgements } from "@/lib/ccs/fetchers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const isAuthorized = await checkCCSAuth(req);
  if (!isAuthorized) {
    return unauthorizedResponse();
  }

  const { contestId } = await params;
  const id = parseInt(contestId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid contest ID" }, { status: 400 });
  }

  const judgements = await getJudgements(id);
  return NextResponse.json(judgements, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
