"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { deleteContest } from "./actions";

interface DeleteContestButtonProps {
  contestId: number;
  contestTitle: string;
  onDeleted: (contestId: number) => void;
}

export default function DeleteContestButton({
  contestId,
  contestTitle,
  onDeleted,
}: DeleteContestButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    setIsDeleting(true);

    try {
      const result = await deleteContest(contestId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      onDeleted(contestId);
      toast.success(`Deleted contest #${contestId}`);
      setIsConfirmOpen(false);
    } catch {
      toast.error("Failed to delete contest");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Contest"
        message={`Delete contest #${contestId} "${contestTitle}"? This will permanently remove its teams, contest-problem links, submissions, balloons, print jobs, and clarifications. Problems in the problem bank will not be deleted.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        isDestructive
      />
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        disabled={isDeleting}
        className="text-red-400 hover:text-red-600 disabled:text-gray-300"
        title="Delete Contest"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </>
  );
}
