import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUpdateTask } from "../api/use-update-task";
import { useRef, useState } from "react";
import { Task } from "../types";
import { toast } from "sonner";
import { MarkdownRenderer } from "./markdown-renderer";
import {
  Pencil,
  Save,
  X,
  Image as ImageIcon,
  Paperclip as PaperclipIcon,
  XCircle,
  Download,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { MarkdownEditor } from "./markdown-editor";

interface TaskDescriptionProps {
  task: Task;
  onTaskUpdated?: (task: Task) => void;
}

export function TaskDescription({ task, onTaskUpdated }: TaskDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingImageRemoved, setExistingImageRemoved] = useState(false);
  const [existingFileRemoved, setExistingFileRemoved] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useUpdateTask();

  const handleSave = async () => {
    const updateData: Record<string, any> = {};

    try {
      // Thêm mô tả nếu thay đổi
      if (description !== task.description) {
        console.log("Description changed, original:", task.description);
        console.log("Description changed, new:", description);

        // Kiểm tra xem có mentions không
        const mentionPattern = /@([^(]+)\(([^)]+)\)/g;
        const matches = Array.from(description.matchAll(mentionPattern));
        if (matches.length > 0) {
          console.log("Saving with mentions:", matches);
        }

        updateData.description = description;
      }

      // Xử lý hình ảnh mới
      if (selectedImage) {
        try {
          // Kiểm tra kích thước
          if (selectedImage.size > 2 * 1024 * 1024) {
            toast.error("Image size must be less than 2MB");
            return;
          }

          const imageBase64 = await fileToBase64(selectedImage);
          updateData.imageUrl = imageBase64;
        } catch (error) {
          console.error("Error processing image:", error);
          toast.error("Failed to process image");
          return;
        }
      } else if (existingImageRemoved && task.imageUrl) {
        // Nếu xóa hình ảnh hiện tại
        updateData.imageUrl = "";
      }

      // Xử lý tệp mới
      if (selectedFile) {
        try {
          // Kiểm tra kích thước
          if (selectedFile.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
          }

          const fileBase64 = await fileToBase64(selectedFile);
          updateData.fileUrl = fileBase64;
          updateData.fileName = selectedFile.name;
        } catch (error) {
          console.error("Error processing file:", error);
          toast.error("Failed to process file");
          return;
        }
      } else if (existingFileRemoved && task.fileUrl) {
        // Nếu xóa tệp tin hiện tại
        updateData.fileUrl = "";
        updateData.fileName = "";
      }

      // Kiểm tra nếu không có gì thay đổi
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        return;
      }

      console.log("Sending update request...");
      console.log("Update data:", JSON.stringify(updateData, null, 2));

      mutate(
        {
          json: updateData,
          param: {
            taskId: task.$id,
          },
        },
        {
          onSuccess: (response) => {
            setIsEditing(false);
            if ("data" in response && onTaskUpdated) {
              onTaskUpdated(response.data as Task);
            }
            toast.success("Task updated successfully");
          },
          onError: (error) => {
            console.error("Error updating task:", error);
            toast.error(
              "Failed to update task. Please check console for details."
            );
          },
        }
      );
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error("An error occurred while preparing the update");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }

    // Reset input để có thể chọn lại cùng một tệp
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }

    // Reset input để có thể chọn lại cùng một tệp
    if (e.target) {
      e.target.value = "";
    }
  };

  // Tạo hàm helper cho việc lấy tên file từ URL
  const getFileNameFromUrl = (url: string): string => {
    // Trích xuất tên file từ URL
    const parts = url.split("/");
    const fileName = parts[parts.length - 1];
    // Giải mã URL nếu cần
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  };

  // Khởi tạo chế độ chỉnh sửa
  const initEditMode = () => {
    console.log("Initializing edit mode with description:", task.description);
    setDescription(task.description || "");
    setIsEditing(true);
  };

  const handleDescriptionChange = (value: string) => {
    console.log("[handleDescriptionChange] Received new value:", value);

    // Kiểm tra xem có tag mentions không
    const mentionPattern = /@([^(]+)\(([^)]+)\)/g;
    const matches = Array.from(value.matchAll(mentionPattern));
    if (matches.length > 0) {
      console.log("[handleDescriptionChange] Mentions detected:", matches);
    } else {
      console.log(
        "[handleDescriptionChange] No mentions detected in new value."
      );
    }

    setDescription(value);
    console.log("[handleDescriptionChange] setDescription called.");
  };

  // Hủy chỉnh sửa
  const cancelEdit = () => {
    setIsEditing(false);
    setDescription(task.description || "");
    setSelectedImage(null);
    setSelectedFile(null);
    setExistingImageRemoved(false);
    setExistingFileRemoved(false);
  };

  if (isEditing) {
    return (
      <Card className="p-4 space-y-4 border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Edit Description</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelEdit}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <MarkdownEditor
            value={description}
            onChange={handleDescriptionChange}
            minHeight="200px"
            placeholder="Enter task description using Markdown..."
          />
        </div>

        {/* Upload Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImageSelect}
            className="flex items-center gap-1"
            disabled={selectedImage !== null}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>
              {task.imageUrl && !existingImageRemoved
                ? "Replace Image"
                : "Add Image"}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFileSelect}
            className="flex items-center gap-1"
            disabled={selectedFile !== null}
          >
            <PaperclipIcon className="h-3.5 w-3.5" />
            <span>
              {task.fileUrl && !existingFileRemoved
                ? "Replace File"
                : "Attach File"}
            </span>
          </Button>

          <TooltipProvider>
            <Tooltip content="Max file size info">
              <TooltipTrigger>
                <div className="inline-flex items-center ml-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Each task can have one image and one file (max 2MB each)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Hiển thị hình ảnh hiện tại nếu có và chưa bị xóa */}
        {task.imageUrl && !existingImageRemoved && (
          <div className="relative border rounded-lg overflow-hidden">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setExistingImageRemoved(true)}
                className="h-6 w-6 rounded-full"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-2 right-2 z-10">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleImageSelect}
                className="bg-white bg-opacity-75 text-xs"
              >
                Replace
              </Button>
            </div>
            <Image
              src={task.imageUrl}
              alt="Current image"
              width={400}
              height={200}
              className="w-full h-auto max-h-[200px] object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Image Preview */}
        {selectedImage && (
          <div className="relative border rounded-lg overflow-hidden">
            <div className="absolute top-2 right-2 z-10">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setSelectedImage(null)}
                className="h-6 w-6 rounded-full"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <Image
              src={URL.createObjectURL(selectedImage)}
              alt="Selected image"
              width={400}
              height={200}
              className="w-full h-auto max-h-[200px] object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Hiển thị tệp hiện tại nếu có và chưa bị xóa */}
        {task.fileUrl && !existingFileRemoved && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <PaperclipIcon className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="text-sm font-medium truncate">
                {task.fileName || getFileNameFromUrl(task.fileUrl)}
              </span>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-shrink-0 gap-1"
            >
              <a
                href={task.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </a>
            </Button>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && (
          <div className="flex items-center justify-between gap-2 p-2 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <PaperclipIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium truncate">
                {selectedFile.name}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedFile(null)}
              className="h-6 w-6"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            onClick={handleSave}
            size="sm"
            disabled={isPending}
            className="gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>
    );
  }

  const contentSection = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Description</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={initEditMode}
          className="h-8 gap-1"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit</span>
        </Button>
      </div>

      <div className="space-y-4">
        {task.description ? (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 p-3 bg-muted/50 rounded-md">
            <MarkdownRenderer content={task.description} />
          </div>
        ) : (
          <div
            onClick={initEditMode}
            className={cn(
              "text-sm text-muted-foreground cursor-pointer p-4 rounded-md border border-dashed flex items-center justify-center hover:bg-accent/50 transition-colors"
            )}
          >
            Add a more detailed description...
          </div>
        )}

        {/* Hiển thị hình ảnh đính kèm nếu có */}
        {task.imageUrl && (
          <div className="border rounded-lg overflow-hidden mt-2">
            <Image
              src={task.imageUrl}
              alt="Task image"
              width={600}
              height={300}
              className="w-full h-auto max-h-[300px] object-contain"
              unoptimized
            />
          </div>
        )}

        {/* Hiển thị file đính kèm nếu có */}
        {task.fileUrl && (
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <PaperclipIcon className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="text-sm font-medium truncate">
                {task.fileName || getFileNameFromUrl(task.fileUrl)}
              </span>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="flex-shrink-0 gap-1"
            >
              <a
                href={task.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="p-4 space-y-3 border shadow-sm">{contentSection}</Card>
  );
}
