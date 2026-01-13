"use server";

import { prisma } from "@/lib/prisma";
import { ContestType } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateContest(contestId: number, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const startTimeStr = formData.get("startTime") as string;
  const endTimeStr = formData.get("endTime") as string;
  const type = formData.get("type") as ContestType;
  const password = formData.get("password") as string;

  // --- 解析 Config 配置 ---
  const frozenDuration = Number(formData.get("frozenDuration") || 0);
  const unfreezeDelay = Number(formData.get("unfreezeDelay") || 300);

  const medalMode = formData.get("medalMode") as "ratio" | "fixed";
  const gold = Number(formData.get("medal_gold") || 0);
  const silver = Number(formData.get("medal_silver") || 0);
  const bronze = Number(formData.get("medal_bronze") || 0);

  const config = {
    frozenDuration,
    unfreezeDelay,
    medal: {
      mode: medalMode,
      gold,
      silver,
      bronze,
    },
  };

  // --- 校验 ---
  if (!title || !startTimeStr || !endTimeStr) {
    throw new Error("Missing required fields");
  }

  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);

  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  await prisma.contest.update({
    where: { id: contestId },
    data: {
      title,
      description,
      startTime,
      endTime,
      type,
      password: password || null,
      config: config,
    },
  });

  revalidatePath("/admin/contests");
  revalidatePath(`/admin/contests/${contestId}`);
  redirect("/admin/contests");
}
