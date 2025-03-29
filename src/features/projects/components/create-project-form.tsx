"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef } from "react";
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
import { ImageIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createProjectSchema } from "../schema";
import { useCreateProject } from "../api/use-create-project";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

interface CreateProjectFormProps {
  onCancel?: () => void;
}

export const CreateProjectForm = ({ onCancel }: CreateProjectFormProps) => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const { mutate, isPending } = useCreateProject();
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema.omit({ workspaceId: true })),
    defaultValues: { name: "" },
  });

  const onSubmit = (values: z.infer<typeof createProjectSchema>) => {
    const finalValues = {
      ...values,
      workspaceId,
      image: values.image instanceof File ? values.image : "",
    };
    mutate(
      { form: finalValues },
      {
        onSuccess: ({ data }) => {
          form.reset();
          router.push(`/workspaces/${workspaceId}/projects/${data.$id}`);
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

  return (
    <div className="relative w-full transform perspective-1000">
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
            <div className="space-y-2">
              <CardTitle
                className="text-2xl font-bold bg-gradient-to-r from-primary 
                to-blue-600 bg-clip-text text-transparent"
              >
                New Project
              </CardTitle>
              <p className="text-sm text-neutral-500">
                Create a new project to get started
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
                      Project Name
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
                          placeholder="Enter project name"
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
                          Project Icon
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
              <div className="flex items-center justify-between gap-4 pt-2">
  {onCancel && (
    <Button
      type="button"
      onClick={onCancel}
      variant="secondary"
      size="lg"
      disabled={isPending}
      className="hover:bg-neutral-100/80 transition duration-300"
    >
      Cancel
    </Button>
  )}
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
                      "Create Workspace"
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
    </div>
  );
};
