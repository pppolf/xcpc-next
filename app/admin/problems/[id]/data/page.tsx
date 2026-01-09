import { getProblemData } from "./actions";
import DataManagementClient from "./client";

export default async function ProblemDataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const problemId = Number((await params).id);
  // 获取初始数据
  const { files, yamlContent } = await getProblemData(problemId);

  return (
    <DataManagementClient
      problemId={problemId}
      initialFiles={files}
      initialYaml={yamlContent}
    />
  );
}
