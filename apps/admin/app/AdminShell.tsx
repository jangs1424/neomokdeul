import { listApplications } from "@neomokdeul/db";
import { Sidebar } from "./Sidebar";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const apps = await listApplications();
  const pendingCount = apps.filter((a) => a.status === "pending").length;
  return (
    <div className="admin-shell">
      <Sidebar pendingCount={pendingCount} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
