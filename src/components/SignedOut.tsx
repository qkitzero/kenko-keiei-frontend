import Card from "@/components/Card";
import LoginButton from "@/components/LoginButton";
import NavIcon from "@/components/NavIcon";
import PageContainer from "@/components/PageContainer";
import PageMessage from "@/components/PageMessage";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app";
import { FEATURE_NAV_ITEMS } from "@/lib/navigation";

function Intro() {
  return (
    <PageContainer centered>
      <h1 className="text-foreground text-xl font-semibold tracking-tight">
        {APP_NAME}
      </h1>
      <p className="text-muted text-sm">{APP_DESCRIPTION}</p>
      <LoginButton />

      <ul className="mt-3 grid w-full max-w-3xl gap-4 text-left sm:grid-cols-3">
        {FEATURE_NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Card as="div" className="flex h-full flex-col gap-2">
              <NavIcon name={item.icon} className="text-primary size-5" />
              <h2 className="text-foreground text-sm font-semibold">
                {item.label}
              </h2>
              <p className="text-muted text-xs">{item.description}</p>
            </Card>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}

function loginRequiredMessage(pathname: string): string {
  const item = FEATURE_NAV_ITEMS.find((navItem) => pathname === navItem.href);
  const lead = item ? `${item.label}を表示するには` : "続けるには";
  return `${lead}ログインしてください。ログイン後はこのページに戻ります。`;
}

export default function SignedOut({ pathname }: { pathname: string }) {
  if (pathname === "/") return <Intro />;

  return (
    <PageMessage
      title="ログインが必要です"
      message={loginRequiredMessage(pathname)}
      action={<LoginButton />}
      link={{ href: "/", label: `${APP_NAME}について` }}
    />
  );
}
