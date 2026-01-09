import ProblemEditor from "@/components/admin/ProblemEditor";
import { getProblem } from "../actions";
import { notFound } from "next/navigation";

export default async function EditProblemPage({
  params,
}:{
  params: { id: string };
}) {
  const problem = await getProblem(Number((await params).id));

  if (!problem) {
    notFound();
  }

  // 核心修改：在传递给组件之前进行数据转换和类型断言
  const formattedProblem = {
    ...problem,
    // 1. 将 Prisma 的 JsonValue 强转为你需要的具体数组类型
    sections: problem.sections as unknown as { title: string; content: string }[],
    samples: problem.samples as unknown as { input: string; output: string }[],
    
    // 2. 处理 hint 的 null vs undefined 问题
    // 数据库出来的可能是 null，组件要的是 undefined
    hint: problem.hint ?? undefined, 
    
    // 3. 处理 judgeConfig (如果需要)
    judgeConfig: problem.judgeConfig as unknown as string | undefined
  };

  return <ProblemEditor initialData={formattedProblem} isEdit={true} />;
}
