import { useMedia } from "react-use";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Drawer, DrawerContent } from "./ui/drawer";
import { VisuallyHidden } from "./ui/visually-hidden";

interface ResponsiveModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export const ResponsiveModal = ({
  children,
  open,
  onOpenChange,
  title = "Dialog Content",
  description = "This is a dialog window",
}: ResponsiveModalProps) => {
  const isDesktop = useMedia("(min-width: 1024px)", true);
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="wfull sm:max-w-lg p-0 border-none overflow-y-auto hide-scrollball max-h-[85vh]">
          <VisuallyHidden>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </VisuallyHidden>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className=" overflow-y-auto hide-scrollball max-h-[85vh]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
