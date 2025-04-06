"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Heading1,
  Heading2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter description...",
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Highlight,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log("Editor update:", { html });

      // Đảm bảo luôn trả về string, không phải undefined
      onChange(html || "");
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-2 border-b flex flex-wrap items-center gap-2">
        <TooltipProvider>
          <ToggleGroup type="multiple" className="flex flex-wrap gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="bold"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  disabled={disabled}
                  data-active={editor.isActive("bold")}
                  aria-label="Bold"
                  className={editor.isActive("bold") ? "bg-accent" : ""}
                >
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bold</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="italic"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  disabled={disabled}
                  data-active={editor.isActive("italic")}
                  aria-label="Italic"
                  className={editor.isActive("italic") ? "bg-accent" : ""}
                >
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Italic</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="underline"
                  size="sm"
                  onClick={() => {
                    // TipTap doesn't have underline in starter kit
                    // Use markdown style instead
                    editor
                      .chain()
                      .focus()
                      .insertContent(
                        "<u>" +
                          editor.state.selection.content().content.firstChild
                            ?.textContent +
                          "</u>"
                      )
                      .run();
                  }}
                  disabled={disabled}
                  aria-label="Underline"
                >
                  <Underline className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Underline</p>
              </TooltipContent>
            </Tooltip>
          </ToggleGroup>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <ToggleGroup type="single" className="flex flex-wrap gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="h1"
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  disabled={disabled}
                  data-active={editor.isActive("heading", { level: 1 })}
                  className={
                    editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""
                  }
                >
                  <Heading1 className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Heading 1</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="h2"
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  disabled={disabled}
                  data-active={editor.isActive("heading", { level: 2 })}
                  className={
                    editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""
                  }
                >
                  <Heading2 className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Heading 2</p>
              </TooltipContent>
            </Tooltip>
          </ToggleGroup>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <ToggleGroup type="multiple" className="flex flex-wrap gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="bulletList"
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  disabled={disabled}
                  data-active={editor.isActive("bulletList")}
                  className={editor.isActive("bulletList") ? "bg-accent" : ""}
                >
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bullet List</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="orderedList"
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  disabled={disabled}
                  data-active={editor.isActive("orderedList")}
                  className={editor.isActive("orderedList") ? "bg-accent" : ""}
                >
                  <ListOrdered className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Numbered List</p>
              </TooltipContent>
            </Tooltip>
          </ToggleGroup>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <ToggleGroup type="single" className="flex flex-wrap gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="left"
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  disabled={disabled}
                  data-active={editor.isActive({ textAlign: "left" })}
                  className={
                    editor.isActive({ textAlign: "left" }) ? "bg-accent" : ""
                  }
                >
                  <AlignLeft className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align Left</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="center"
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  disabled={disabled}
                  data-active={editor.isActive({ textAlign: "center" })}
                  className={
                    editor.isActive({ textAlign: "center" }) ? "bg-accent" : ""
                  }
                >
                  <AlignCenter className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align Center</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="right"
                  size="sm"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  disabled={disabled}
                  data-active={editor.isActive({ textAlign: "right" })}
                  className={
                    editor.isActive({ textAlign: "right" }) ? "bg-accent" : ""
                  }
                >
                  <AlignRight className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align Right</p>
              </TooltipContent>
            </Tooltip>
          </ToggleGroup>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <ToggleGroup type="multiple" className="flex flex-wrap gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="link"
                  size="sm"
                  onClick={() => {
                    const url = window.prompt("URL");
                    if (url) {
                      editor
                        .chain()
                        .focus()
                        .extendMarkRange("link")
                        .setLink({ href: url })
                        .run();
                    } else {
                      editor.chain().focus().unsetLink().run();
                    }
                  }}
                  disabled={disabled}
                  data-active={editor.isActive("link")}
                  className={editor.isActive("link") ? "bg-accent" : ""}
                >
                  <LinkIcon className="h-4 w-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Insert Link</p>
              </TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </TooltipProvider>
      </div>

      <EditorContent
        editor={editor}
        className="prose max-w-none p-3 min-h-[200px] focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
};
