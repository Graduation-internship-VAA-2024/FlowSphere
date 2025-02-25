import { UserButton } from "@/features/auth/components/user-button";
import { MobileSidebar } from "./mobile-sidebar";

export const Navbar = () => {
  return (
    <nav className="pt-6 px-6 flex items-center justify-between">
      <div className="flex-col hidden lg:flex">
        <h1 className="text-2xl font-semibold">Dasboard</h1>
        <p className="text-muted-foreground">
          {" "}
          Monitor your tasks and projects{" "}
        </p>
      </div>
      <MobileSidebar />
      <UserButton />
    </nav>
  );
};
