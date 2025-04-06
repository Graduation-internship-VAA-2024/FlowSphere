import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUpdateTask } from "../api/use-update-task";
import { useRef, useState } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { Task } from "../types";
import { toast } from "sonner";
import { MarkdownRenderer } from "./markdown-renderer";
import {
  Pencil,
  Save,
  X,
  ImageIcon,
  PaperclipIcon,
  XCircle,
  Download,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";

interface TaskDescriptionProps {
  task: Task;
  onTaskUpdated?: (task: Task) => void;
}

export function TaskDescription({ task, onTaskUpdated }: TaskDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(task.description || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate, isPending } = useUpdateTask();

  const handleSave = async () => {
    const updateData: Record<string, any> = {
      description,
    };

    try {
      console.log("Starting task update...");

      // Xử lý hình ảnh nếu có
      if (selectedImage) {
        try {
          // Kiểm tra kích thước hình ảnh (giới hạn 2MB)
          if (selectedImage.size > 2 * 1024 * 1024) {
            toast.error("Image size must be less than 2MB");
            return;
          }

          // Chuyển đổi trực tiếp
          const imageBase64 = await fileToBase64(selectedImage);
          updateData.imageUrl = imageBase64;
          console.log("Image prepared for upload");
        } catch (error) {
          console.error("Error processing image:", error);
          toast.error("Failed to process image");
          return;
        }
      }

      // Xử lý file nếu có
      if (selectedFile) {
        // Kiểm tra kích thước file (giới hạn 2MB)
        if (selectedFile.size > 2 * 1024 * 1024) {
          toast.error("File size must be less than 2MB");
          return;
        }

        try {
          const fileBase64 = await fileToBase64(selectedFile);
          updateData.fileUrl = fileBase64;
          updateData.fileName = selectedFile.name;
          console.log("File prepared for upload");
        } catch (error) {
          console.error("Error processing file:", error);
          toast.error("Failed to process file");
          return;
        }
      }

      console.log("Sending update request...");

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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  // Lấy tên file từ URL
  const getFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split("/");
      return parts[parts.length - 1].split("?")[0] || "download";
    } catch {
      return task.fileName || "download";
    }
  };

  if (isEditing) {
    return (
      <Card className="p-4 space-y-4 border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Edit Description</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setDescription(task.description || "");
              setSelectedImage(null);
              setSelectedFile(null);
            }}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <RichTextEditor
          value={description}
          onChange={handleDescriptionChange}
        />

        {/* Upload Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImageSelect}
            className="flex items-center gap-1"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Add Image</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFileSelect}
            className="flex items-center gap-1"
          >
            <PaperclipIcon className="h-3.5 w-3.5" />
            <span>Attach File</span>
          </Button>

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

        {/* File Preview */}
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
            <PaperclipIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium flex-1 truncate">
              {selectedFile.name}
            </span>
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

  return (
    <Card className="p-4 space-y-3 border shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Description</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-8 gap-1"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit</span>
        </Button>
      </div>

      {task.description ? (
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 p-3 bg-muted/50 rounded-md">
          <MarkdownRenderer content={task.description} />
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
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
    </Card>
  );
}
