"use client";
import { useState, useEffect } from "react";
import { Loader, LogOutIcon, UserIcon } from "lucide-react";
import { useCurrent } from "../api/use-current";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DottedSeparator } from "@/components/dotted-separator";
import { useLogout } from "../api/use-logout";
import { UserProfile } from "./user-profile";

export const UserButton = () => {
  const { mutate: logout } = useLogout();
  const { data: user, isLoading } = useCurrent();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="size-10 rounded-full flex items-center justify-center bg-neutral-200 border border-neutral-300">
        <Loader className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="size-10 rounded-full flex items-center justify-center bg-neutral-200 border border-neutral-300">
        <Loader className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { name, email } = user;

  // Get user initials for avatar
  const avatarFallback = name
    ? name.charAt(0).toUpperCase()
    : email.charAt(0).toUpperCase() ?? "U";

  // Generate avatar image URL using Appwrite's Avatars service
  const avatarUrl = `https://cloud.appwrite.io/v1/avatars/initials?name=${encodeURIComponent(
    name || email
  )}`;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="outline-none relative">
        <Avatar className="size-10 hover:opacity-75 transition border-2 border-white shadow-sm">
          <AvatarImage src={avatarUrl} alt={name || "User"} />
          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-60"
        sideOffset={10}
      >
        <div className="flex flex-col items-center justify-center gap-x-2 px-2.5 py-4">
          <Avatar className="size-[60px] border-2 border-white shadow-sm mb-2">
            <AvatarImage src={avatarUrl} alt={name || "User"} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-xl font-medium text-white">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-neutral-900">
              {name || "Người dùng"}
            </p>
            <p className="text-xs text-neutral-500">{email}</p>
          </div>
        </div>
        <DottedSeparator className="mb-1" />
        <UserProfile
          user={user}
          trigger={
            <DropdownMenuItem
              className="h-10 flex items-center justify-center font-medium cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <UserIcon className="size-4 mr-2" /> Thông tin chi tiết
            </DropdownMenuItem>
          }
        />
        <DropdownMenuItem
          onClick={() => logout()}
          className="h-10 flex items-center justify-center text-red-600 font-medium cursor-pointer"
        >
          <LogOutIcon className="size-4 mr-2" /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
