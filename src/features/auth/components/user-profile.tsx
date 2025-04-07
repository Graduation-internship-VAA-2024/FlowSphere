"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changeNameSchema, changePasswordSchema } from "../schemas";
import { useChangePassword } from "../api/use-change-password";
import { useChangeName } from "../api/use-change-name";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types/user";
import { KeyIcon, PencilIcon, UserIcon } from "lucide-react";

interface UserProfileProps {
  user: User;
  trigger: React.ReactNode;
}

export const UserProfile = ({ user, trigger }: UserProfileProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const { mutate: changePassword, isPending: isChangingPassword } =
    useChangePassword();
  const { mutate: changeName, isPending: isChangingName } = useChangeName();

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
    },
  });

  const nameForm = useForm<z.infer<typeof changeNameSchema>>({
    resolver: zodResolver(changeNameSchema),
    defaultValues: {
      name: user.name || "",
    },
  });

  const onPasswordSubmit = (data: z.infer<typeof changePasswordSchema>) => {
    changePassword(data, {
      onSuccess: () => {
        passwordForm.reset();
        // Optionally close the dialog
        // setOpen(false);
      },
    });
  };

  const onNameSubmit = (data: z.infer<typeof changeNameSchema>) => {
    changeName(data, {
      onSuccess: () => {
        // Keep the form values as they are
      },
    });
  };

  // Generate avatar image URL using Appwrite's Avatars service
  const avatarUrl = user
    ? `https://cloud.appwrite.io/v1/avatars/initials?name=${encodeURIComponent(
        user.name || user.email
      )}`
    : undefined;

  // Generate user initials for avatar fallback
  const userInitials = user.name
    ? user.name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>View and edit your user profile information</DialogDescription>
        </DialogHeader>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 py-8 px-6 text-white">
          <div className="flex items-center gap-4">
            <Avatar className="size-20 border-4 border-white/20">
              <AvatarImage src={avatarUrl} alt={user.name || "User"} />
              <AvatarFallback className="bg-white text-indigo-700 text-xl font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{user.name || "User"}</h2>
              <p className="text-white/80">{user.email}</p>
            </div>
          </div>
        </div>

        <Tabs
          defaultValue="profile"
          value={activeTab}
          onValueChange={setActiveTab}
          className="p-6"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="size-4" />
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="name" className="flex items-center gap-2">
              <PencilIcon className="size-4" />
              Đổi tên
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <KeyIcon className="size-4" />
              Đổi mật khẩu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-500 mb-1">
                  Tên người dùng
                </h3>
                <p className="text-base font-medium">
                  {user.name || "Chưa đặt tên"}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-500 mb-1">
                  Email
                </h3>
                <p className="text-base font-medium">{user.email}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-500 mb-1">
                  Ngày tạo tài khoản
                </h3>
                <p className="text-base font-medium">
                  {new Date(user.$createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="name">
            <Form {...nameForm}>
              <form
                onSubmit={nameForm.handleSubmit(onNameSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={nameForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên người dùng</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên của bạn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  disabled={isChangingName}
                >
                  {isChangingName ? "Đang cập nhật..." : "Cập nhật tên"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="password">
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={passwordForm.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu hiện tại</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword
                    ? "Đang cập nhật..."
                    : "Cập nhật mật khẩu"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
