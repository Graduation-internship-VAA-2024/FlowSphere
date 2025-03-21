import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { CreateWorkspacesModal } from "@/features/workspaces/components/create-workspaces-modal";

interface DashboardLayoutProps {
  children: React.ReactNode;
}
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen">
      <CreateWorkspacesModal />
      <CreateProjectModal />
      <div className="flex w-full h-full ">
        <div
          className="fixed left-0 top-0 hidden lg:block lg:w-[264px] h-full overflow-y-auto
  bg-gradient-to-b from-white to-neutral-50/95
  rounded-r-[32px]
  border-r border-white/30
  shadow-[8px_0_30px_-12px_rgba(0,0,0,0.2)]
  backdrop-blur-xl
"
        >
          <Sidebar />
        </div>
        <div className="lg:pl-[256px] w-full">
          <div className="mx-auto max-x-screen-2xl h-full">
            <Navbar />
            <main className="h-full py-8 px-6 flex flex-col">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
