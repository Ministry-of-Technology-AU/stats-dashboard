import { AppSidebar } from '@/components/Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardWrapper } from '@/components/DashboardWrapper';
import { auth } from '@/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  return (
    <DashboardWrapper userEmail={session?.user?.email}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </DashboardWrapper>
  );
}
