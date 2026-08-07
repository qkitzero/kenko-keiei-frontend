import PageMessage from "@/components/PageMessage";

export default function NotFound() {
  return (
    <PageMessage
      title="ページが見つかりません"
      message="URL が変わったか、削除された可能性があります。"
      link={{ href: "/", label: "ホームに戻る" }}
    />
  );
}
