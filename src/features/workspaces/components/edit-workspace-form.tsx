"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateWorkspaceSchema } from "../schema";
import { useRef, useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { DottedSeparator } from "@/components/dotted-separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle,
  ArrowLeftIcon,
  ImageIcon,
  Sparkles,
  Copy,
  KeyRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Workspace } from "../type";
import { useUpateWorkspace } from "../api/use-update-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { useDeleteWorkspace } from "../api/use-delete-workspace ";
import { toast } from "sonner";
import { useResetInviteCode } from "../api/use-reset-invite-code";

interface EditWorkspaceFormProps {
  onCancel?: () => void;
  initiaValues: Workspace;
}

export const EditWorkspaceForm = ({
  onCancel,
  initiaValues,
}: EditWorkspaceFormProps) => {
  const router = useRouter();
  const { mutate, isPending } = useUpateWorkspace();
  const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } =
    useDeleteWorkspace();
  const { mutate: resetInviteCode, isPending: isResettingInviteCode } =
    useResetInviteCode();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Workspace",
    "Are you sure you want to delete this workspace? This action cannot be undone.",
    "destructive"
  );
  const [ResetDialog, confirmReset] = useConfirm(
    "Reset Invite Code",
    "Are you sure you want to reset the invite code for this workspace?",
    "destructive"
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: { ...initiaValues, image: initiaValues.imageUrl ?? "" },
  });
  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;
    deleteWorkspace(
      {
        param: { workspaceId: initiaValues.$id },
      },
      {
        onSuccess: () => {
          window.location.href = "/";
        },
      }
    );
  };

  const handleResetInviteCode = async () => {
    const ok = await confirmReset();
    if (!ok) return;
    resetInviteCode({
      param: { workspaceId: initiaValues.$id },
    });
  };

  const onSubmit = (values: z.infer<typeof updateWorkspaceSchema>) => {
    const finalValues = {
      ...values,
      image: values.image instanceof File ? values.image : "",
    };
    mutate(
      { form: finalValues, param: { workspaceId: initiaValues.$id } },
      {
        onSuccess: () => {
          form.reset();
        },
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
    }
  };

  // Add state for invite link and copying state
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isCopying, setIsCopying] = useState(false);

  // Handle window object with useEffect
  useEffect(() => {
    setInviteLink(
      `${window.location.origin}/workspaces/${initiaValues.$id}/join/${initiaValues.inviteCode}`
    );
  }, [initiaValues.$id, initiaValues.inviteCode]);

  // Updated copy handler
  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;

    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy invite link");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="relative w-full  transform perspective-1000">
      <DeleteDialog />
      <ResetDialog />
      {/* 3D Floating Effect Container */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/10 
        rounded-2xl blur-2xl opacity-50 transform -rotate-x-12 scale-95"
      />

      <Card
        className="relative w-full border-none shadow-none overflow-hidden
        bg-white/80 backdrop-blur-xl rounded-2xl
        transform transition-all duration-500 hover:-rotate-x-2 hover:translate-y-[-2px]"
      >
        {/* Animated Gradient Border */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 
          to-primary/20 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity"
        />

        <CardHeader className="relative p-7 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                className="w-fit "
                size="sm"
                onClick={
                  onCancel ??
                  (() => router.push(`/workspaces/${initiaValues.$id}`))
                }
                variant="secondary"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </Button>

              <CardTitle
                className="text-2xl font-bold bg-gradient-to-r from-primary 
                to-blue-600 bg-clip-text text-transparent"
              >
                {initiaValues.name}{" "}
              </CardTitle>
              <p className="text-sm text-neutral-500">
                Set up your collaborative environment in seconds
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-primary/50 animate-pulse" />
          </div>
        </CardHeader>

        <div className="px-7 py-4">
          <DottedSeparator className="opacity-50" />
        </div>

        <CardContent className="p-7">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Workspace Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-neutral-800 font-medium">
                      Workspace Name
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div
                          className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 
                          to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 
                          transition duration-300"
                        />
                        <Input
                          {...field}
                          placeholder="Enter workspace name"
                          className="relative bg-white/80 border-white/20 h-11
                            focus:ring-2 focus:ring-primary/20 focus:border-primary/30
                            hover:border-primary/30 transition duration-300"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Workspace Icon Field */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <div
                    className="relative group rounded-xl p-4 
                    bg-neutral-50/50 border border-neutral-100/50
                    hover:bg-white/50 transition duration-300"
                  >
                    <div className="flex items-center gap-x-5">
                      {/* Image Preview */}
                      <div className="relative">
                        {field.value ? (
                          <div
                            className="w-[72px] h-[72px] relative rounded-xl overflow-hidden
                            ring-2 ring-neutral-200/50 ring-offset-2 group-hover:ring-primary/30
                            transition duration-300"
                          >
                            <Image
                              alt="logo"
                              fill
                              className="object-cover"
                              src={
                                field.value instanceof File
                                  ? URL.createObjectURL(field.value)
                                  : field.value
                              }
                            />
                          </div>
                        ) : (
                          <Avatar
                            className="w-[72px] h-[72px] rounded-xl
                            ring-2 ring-neutral-200/50 ring-offset-2 group-hover:ring-primary/30
                            transition duration-300"
                          >
                            <AvatarFallback className="bg-neutral-100/50">
                              <ImageIcon className="w-8 h-8 text-neutral-400" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-neutral-800">
                          Workspace Icon
                        </p>
                        <p className="text-xs text-neutral-500">
                          JPG, PNG, SVG, GIF, max 1MB
                        </p>
                        <input
                          className="hidden"
                          type="file"
                          accept=".jpg, .jpeg, .png, .svg, .gif"
                          ref={inputRef}
                          disabled={isPending}
                          onChange={handleImageChange}
                        />
                        {field.value ? (
                          <Button
                            type="button"
                            onClick={() => {
                              field.onChange(null);
                              if (inputRef.current) inputRef.current.value = "";
                            }}
                            variant="destructive"
                            size="xs"
                            className="w-fit mt-2 group-hover:bg-primary/10 
                            transition duration-300"
                          >
                            Remove Image{" "}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            variant="teritary"
                            size="xs"
                            className="w-fit mt-2 group-hover:bg-primary/10 
                            transition duration-300"
                          >
                            Upload Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              />

              <DottedSeparator className="py-7 opacity-50" />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  onClick={onCancel}
                  variant="secondary"
                  size="lg"
                  disabled={isPending}
                  className={cn(
                    "hover:bg-neutral-100/80 transition duration-300",
                    !onCancel && "invisible"
                  )}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className={cn(
                    "relative w-full md:w-auto min-w-[160px] overflow-hidden",
                    "bg-gradient-to-r from-primary to-blue-600",
                    "text-white font-medium",
                    "shadow-lg shadow-primary/20",
                    "transition-all duration-300",
                    "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
                    "active:shadow-md active:translate-y-0",
                    "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none",
                    // Add focus states for better accessibility
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                    // Add touch states for mobile
                    "touch-none select-none"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </span>
                  {/* Interactive background effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 
                      translate-x-[-100%] animate-shimmer"
                  />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* Danger Zone Section */}
      <div className="xl:col-span-4 mt-8 xl:mt-0">
        <Card
          className="relative overflow-hidden bg-white/80 backdrop-blur-xl 
              border-red-100/20 shadow-xl shadow-black/[0.02]
              transform transition-all duration-500 hover:-translate-y-1"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 
                opacity-50"
          />

          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <h3 className="font-semibold text-lg text-red-500">
                  Danger Zone
                </h3>
              </div>

              <DottedSeparator className="opacity-30" />

              <div className="space-y-4 ">
                <div className="p-4 bg-red-50/50 rounded-lg border border-red-100/50">
                  <ul className="text-sm text-neutral-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>
                        All workspace data will be permanently deleted
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>
                        All member access and permissions will be removed
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>This action cannot be undone</span>
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full group"
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending || isDeletingWorkspace}
                >
                  <span
                    className="relative inline-flex items-center gap-2 text-red-500 
                        group-hover:text-red-600 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Delete Workspace
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Invite Members Card */}
      <div className="xl:col-span-4 mt-6">
        <Card
          className="relative overflow-hidden bg-white/80 backdrop-blur-xl 
          border-primary/20 shadow-xl shadow-black/[0.02]
          transform transition-all duration-500 hover:-translate-y-1"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 
            opacity-50"
          />

          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg text-neutral-800">
                    Invite Members
                  </h3>
                </div>
                <KeyRound className="w-5 h-5 text-primary/50 animate-pulse" />
              </div>

              <DottedSeparator className="opacity-30" />

              {/* Content */}
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-neutral-600">
                    Share this link with team members you want to invite to your
                    workspace
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 group">
                    <div
                      className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 
                      to-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 
                      transition duration-300"
                    />
                    <Input
                      readOnly
                      value={inviteLink}
                      className="relative bg-white/80 border-neutral-200/50
                        focus:ring-2 focus:ring-primary/20 focus:border-primary/30
                        hover:border-primary/30 transition duration-300"
                    />
                  </div>

                  <Button
                    onClick={handleCopyInviteLink}
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 shrink-0 bg-white hover:bg-neutral-50
                      active:bg-neutral-100 cursor-pointer disabled:cursor-not -allowed
                      border border-neutral-200/50 hover:border-primary/30
                      transition-all duration-200 relative"
                    disabled={isCopying}
                  >
                    {isCopying ? (
                      <span
                        className="w-4 h-4 border-2 border-primary/30 
                        border-t-primary rounded-full animate-spin"
                      />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <Button
                  className="w-full group"
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={handleResetInviteCode}
                  disabled={isPending || isResettingInviteCode}
                >
                  <span
                    className="relative inline-flex items-center gap-2 
                        group-hover:text-primary transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Invite Code
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
