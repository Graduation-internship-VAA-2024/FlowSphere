import { Loader } from "lucide-react";

const DashboardLoading = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader className="animate-spin text-muted-foreground size-6" />
    </div>
  );
};
export default DashboardLoading;
