import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/common/Panel";
import { StatusDot } from "@/components/common/StatusDot";
import { PageContainer } from "@/components/layout/PageContainer";
import { TopBar } from "@/components/layout/TopBar";
import { useUsers } from "@/hooks/use-monitoring";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — Sentinel AI Exam Monitoring" },
      {
        name: "description",
        content: "Administrator and operator accounts with role-based access to the system.",
      },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const users = useUsers();
  return (
    <>
      <TopBar title="Users & Roles" subtitle="Administrator access" />
      <PageContainer>
        <Panel
          title="Accounts"
          subtitle="Operators review events; administrators also manage cameras, rules and users."
          bodyClassName="p-0"
        >
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border/70">
                <th className="label-tech px-3 py-2">Status</th>
                <th className="label-tech px-3 py-2">Name</th>
                <th className="label-tech px-3 py-2">Email</th>
                <th className="label-tech px-3 py-2">Role</th>
                <th className="label-tech px-3 py-2">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(users.data ?? []).map((user) => (
                <tr key={user.id} className="hover:bg-surface-2/60">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <StatusDot
                        tone={user.status === "active" ? "online" : "offline"}
                        pulse={user.status === "active"}
                      />
                      <span className="label-tech text-muted-foreground">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-foreground">{user.fullName}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-[3px] border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                    {formatRelative(user.lastActiveAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}