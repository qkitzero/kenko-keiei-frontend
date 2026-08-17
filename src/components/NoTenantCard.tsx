"use client";

import Card from "@/components/Card";
import CopyableId from "@/components/CopyableId";
import { useUser } from "@/context/UserContext";

export default function NoTenantCard({ action }: { action?: React.ReactNode }) {
  const { user, loading } = useUser();

  return (
    <Card as="div" padding="lg" dashed>
      <p className="text-foreground text-sm font-medium">
        まだテナントに所属していません
      </p>
      <p className="text-muted mt-1 text-sm">
        既存のテナントに参加するには、あなたのユーザー ID
        を管理者に伝えてメンバーに追加してもらいます。自分でテナントを作ることもできます。
      </p>
      <div className="border-border bg-surface-muted mt-4 max-w-sm rounded-md border p-3">
        {user ? (
          <CopyableId label="あなたのユーザー ID" value={user.userId} />
        ) : (
          <p className="text-subtle text-xs">
            {loading
              ? "あなたのユーザー ID を読み込んでいます。"
              : "あなたのユーザー ID を取得できませんでした。ページを再読み込みしてください。"}
          </p>
        )}
      </div>
      {action && <div className="mt-4 print:hidden">{action}</div>}
    </Card>
  );
}
