import { requireUser } from "@/lib/auth";
import { ROLE } from "@/lib/roles";
import { NavBar } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-canvas">
      <NavBar name={user.name} isAdmin={user.role === ROLE.ADMIN} />
      <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
