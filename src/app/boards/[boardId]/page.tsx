import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BoardPageClient } from "@/components/board/board-page-client";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <BoardPageClient boardId={boardId} userId={user.id} />;
}
