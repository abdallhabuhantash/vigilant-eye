import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ScanEye, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Sentinel AI Exam Monitoring" },
      {
        name: "description",
        content:
          "Secure operator sign-in for the Sentinel AI-powered IP camera exam monitoring console.",
      },
      { property: "og:title", content: "Sign in — Sentinel AI Exam Monitoring" },
      {
        property: "og:description",
        content: "Secure operator sign-in for the Sentinel exam monitoring console.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isAuthenticated) void navigate({ to: "/dashboard", replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn(email, password);
      await navigate({ to: "/dashboard", replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="hud-grid flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="grid size-10 place-items-center rounded-[3px] border border-primary/50 bg-primary/10 text-primary glow-ring">
            <ScanEye className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-mono text-base tracking-[0.16em] text-foreground">SENTINEL</p>
            <p className="label-tech">AI Exam Monitoring Console</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="panel space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="label-tech">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="label-tech">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <p className="rounded-[3px] border border-destructive/50 bg-destructive/10 px-2 py-1.5 font-mono text-xs text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Authenticating…" : "Sign in"}
          </Button>

          <div className="flex items-start gap-2 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p>
              Accounts are created by an administrator. There is no public registration for this
              monitoring console.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}