import { useCurrent } from "@/features/auth/api/use-current";

export const useCurrentUser = () => {
  const { data: user, isLoading } = useCurrent();
  return { user, isLoading };
};