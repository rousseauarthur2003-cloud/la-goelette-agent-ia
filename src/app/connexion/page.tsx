import type { Metadata } from "next";
import { getConfig } from "@/server/config";
import { LoginForm } from "@/components/layout/LoginForm";

export const metadata: Metadata = { title: "Connexion" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = typeof sp.suite === "string" && sp.suite.startsWith("/") && !sp.suite.startsWith("//") ? sp.suite : "/";
  const cfg = getConfig();
  return (
    <div className="content login">
      <div className="card">
        <h1>Connexion du fondateur</h1>
        {cfg.authEnabled ? (
          <LoginForm next={next} />
        ) : (
          <p className="muted">
            La connexion n&apos;est pas configurée sur ce serveur. Ajoutez <code>FOUNDER_PASSWORD</code> et{" "}
            <code>AUTH_SECRET</code> dans les variables d&apos;environnement, puis redéployez.
          </p>
        )}
      </div>
    </div>
  );
}
