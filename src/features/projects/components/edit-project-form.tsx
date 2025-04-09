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
import {
  AlertTriangle,
  ArrowLeftIcon,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { Project } from "../type";
import { useUpdateProject } from "../api/use-update-project";
import { updateProjectSchema } from "../schema";
import { useDeleteProject } from "../api/use-delete-project";
import { motion } from "framer-motion";

interface EditProjectFormProps {
  onCancel?: () => void;
  initiaValues: Project;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      staggerChildren: 0.3,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const EditProjectForm = ({
  onCancel,
  initiaValues,
}: EditProjectFormProps) => {
  const router = useRouter();
  const { mutate, isPending } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeletingProject } =
    useDeleteProject();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Project",
    "Are you sure you want to delete this project? This action will also delete all tasks associated with this project. This action cannot be undone.",
    "destructive"
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof updateProjectSchema>>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: { ...initiaValues, image: initiaValues.imageUrl ?? "" },
  });
  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;
    deleteProject(
      {
        param: { projectId: initiaValues.$id },
      },
      {
        onSuccess: () => {
          window.location.href = `/workspaces/${initiaValues.workspaceId}`;
        },
      }
    );
  };

  const onSubmit = (values: z.infer<typeof updateProjectSchema>) => {
    const finalValues = {
      ...values,
      image: values.image instanceof File ? values.image : "",
    };
    mutate({ form: finalValues, param: { projectId: initiaValues.$id } });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
    }
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(
        `/workspaces/${initiaValues.workspaceId}/projects/${initiaValues.$id}`
      );
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto max-w-7xl px-4 py-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[3fr,2fr] gap-6">
        {/* Main Edit Form */}
        <motion.div variants={cardVariants} className="h-full">
          <Card
            className="relative overflow-hidden bg-gradient-to-br from-white/95 to-white/90 
            backdrop-blur-xl border-primary/20 shadow-xl shadow-primary/5"
          >
            <CardHeader className="border-b border-primary/10 bg-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group rounded-lg px-4 py-2 bg-primary text-white
                      hover:bg-primary/90 transition-all duration-300"
                    onClick={handleBack}
                  >
                    <motion.div
                      className="absolute inset-0 bg-black/10 rounded-lg opacity-0 
                      group-hover:opacity-100 transition-opacity duration-200"
                    />
                    <div className="flex items-center gap-2">
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Back</span>
                    </div>
                  </motion.button>
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {initiaValues.name}
                    </CardTitle>
                    <p className="text-sm text-neutral-500 mt-1">
                      Edit project details
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
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
                                  if (inputRef.current)
                                    inputRef.current.value = "";
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
                  <div className="flex items-center justify-end gap-4 mt-8">
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Button
                        type="submit"
                        disabled={isPending}
                        className="relative px-6 py-2.5 bg-gradient-to-r from-primary to-blue-500
                      text-white rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30
                      transition-all duration-300"
                      >
                        {isPending ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-5 h-5 border-2 border-white/30 border-t-blue-700 rounded-full"
                          />
                        ) : (
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Save Changes
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone - Right Column */}
        <motion.div variants={cardVariants} className="h-full">
          <Card
            className="relative overflow-hidden bg-gradient-to-br from-red-50/80 to-red-50/40
            backdrop-blur-xl border-red-100/50 shadow-lg"
          >
            <CardHeader className="border-b border-red-100/50 bg-white/30">
              <CardTitle className="text-red-600 flex items-center gap-2 text-lg">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertTriangle className="w-5 h-5" />
                </motion.div>
                Danger Zone
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-4 bg-red-50/80 rounded-lg border border-red-200/50">
                  <ul className="text-sm text-neutral-600 space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>All project data will be permanently deleted</span>
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

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={isPending || isDeletingProject}
                  className={`
                    w-full p-3.5 rounded-lg font-medium flex items-center justify-center gap-2
                    ${
                      isDeletingProject
                        ? "bg-red-100/50 text-red-400"
                        : "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
                    }
                    transition-all duration-300 shadow-lg hover:shadow-red-500/20
                  `}
                >
                  {isDeletingProject ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full"
                    />
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Delete Project
                    </>
                  )}
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <DeleteDialog />
    </motion.div>
  );
};
