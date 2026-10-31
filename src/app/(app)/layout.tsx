import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-10 pt-20 sm:px-6 sm:py-8 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}