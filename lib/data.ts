// lib/data.ts (模拟)
export async function getContestData(id: string) {
  // 模拟数据库延迟
  // await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    id: id,
    title: "2025“钉耙编程”中国大学生算法设计暑期联赛（2）",
    content: "This contest requires a specific team account. Accounts from other contests cannot be used here.",
    startTime: "2025-07-21 12:00:00",
    endTime: "2025-07-21 17:00:00",
    status: "Ended",
    isPrivate: true,
  };
}