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
import { useConfirm } from "@/hooks/use-confirm";
import { Project } from "../type";
import { useUpdateProject } from "../api/use-update-projec";
import { updateProjectSchema } from "../schema";
import { useDeleteProject } from "../api/use-delete-project";
import { motion } from "framer-motion";

// Thêm variants cho animation
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

interface EditProjectFormProps {
  onCancel?: () => void;
  initiaValues: Project;
}

export const EditProjectForm = ({
  onCancel,
  initiaValues,
}: EditProjectFormProps) => {
  const { mutate, isPending } = useUpdateProject();
  const { mutate: deleteProject, isPending: isDeletingProject } =
    useDeleteProject();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Project",
    "Are you sure you want to delete this project? This action cannot be undone.",
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
    mutate(
      { form: finalValues, param: { projectId: initiaValues.$id } },
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto max-w-7xl px-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-8">
        {/* Edit Section - Left Column */}
        <motion.div variants={cardVariants} className="h-full">
          <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border-primary/20 h-full">
            <CardHeader>
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg px-4 py-2 bg-primary text-white"
                  onClick={onCancel}
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </motion.button>
                <CardTitle>{initiaValues.name}</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
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
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex justify-end"
                  >
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-500 to-primary bg-size-200 
                    hover:bg-pos-100 transition-all duration-500 px-8 py-2.5 rounded-lg text-white font-medium"
                    >
                      {isPending ? (
                        <motion.div
                          animate={{
                            rotate: 360,
                            background: [
                              "linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%)",
                            ],
                          }}
                          transition={{
                            rotate: {
                              repeat: Infinity,
                              duration: 1,
                              ease: "linear",
                            },
                            background: {
                              repeat: Infinity,
                              duration: 2,
                            },
                          }}
                          className="w-6 h-6 border-3 border-blue-300 border-t-blue-500 rounded-full"
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Save Changes
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Section - Right Column */}
        <motion.div variants={cardVariants} className="h-full">
          <Card className="relative overflow-hidden bg-red-50/30 backdrop-blur-xl border-red-100 shadow-lg h-full">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>

            <CardContent>
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="p-4 bg-red-100/20 rounded-lg border border-red-200">
                  <ul className="space-y-2 text-red-600">
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>This action cannot be undone</span>
                    </li>
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
                  </ul>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full p-3 rounded-lg font-medium
                    ${
                      isDeletingProject
                        ? "bg-red-100 text-red-400"
                        : "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600"
                    }
                    transition-all duration-300 shadow-lg hover:shadow-red-500/25
                  `}
                  onClick={handleDelete}
                  disabled={isDeletingProject}
                >
                  {isDeletingProject ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                      className="w-5 h-5 mx-auto border-2 border-red-400 border-t-transparent rounded-full"
                    />
                  ) : (
                    "Delete Project"
                  )}
                </motion.button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <DeleteDialog />
    </motion.div>
  );
};
