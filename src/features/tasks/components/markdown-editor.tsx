"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MemberRole } from "@/features/members/types";
import { formatMemberName } from "@/features/members/utils";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link2,
  Code,
  AtSign,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  placeholder?: string;
}

type AppwriteDocument = {
  $id: string;
  name: string;
  email?: string;
  role?: MemberRole;
  userId?: string;
  workspaceId?: string;
  $collectionId?: string;
  $databaseId?: string;
  $createdAt?: string;
  $updatedAt?: string;
  $permissions?: string[];
  [key: string]: any;
};

export function MarkdownEditor({
  value,
  onChange,
  minHeight = "150px",
  placeholder,
}: MarkdownEditorProps) {
  const workspaceId = useWorkspaceId();
  const { data: membersData } = useGetMembers({ workspaceId });
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  // Lấy danh sách thành viên từ response API
  const members = membersData?.documents || [];

  // Lọc danh sách thành viên dựa trên từ khóa tìm kiếm
  const filteredMembers = mentionFilter
    ? members.filter((member: AppwriteDocument) =>
        formatMemberName(member)
          .toLowerCase()
          .includes(mentionFilter.toLowerCase())
      )
    : members;

  // Debug để xem danh sách thành viên
  useEffect(() => {
    if (members.length > 0) {
      console.log("Available members:", members);
    }
  }, [members]);

  // Debug: log filteredMembers
  useEffect(() => {
    if (mentionFilter) {
      console.log(
        `Filtering members with query "${mentionFilter}":`,
        filteredMembers
      );
    }
  }, [mentionFilter, filteredMembers]);

  // Hàm định dạng văn bản
  const applyStyle = useCallback(
    (style: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const beforeText = value.substring(0, start);
      const afterText = value.substring(end);

      let newText = value;
      let newCursorPos = 0;

      switch (style) {
        case "bold":
          newText = beforeText + `**${selectedText}**` + afterText;
          newCursorPos = start + 2 + selectedText.length + 2;
          break;
        case "italic":
          newText = beforeText + `*${selectedText}*` + afterText;
          newCursorPos = start + 1 + selectedText.length + 1;
          break;
        case "underline":
          newText = beforeText + `<u>${selectedText}</u>` + afterText;
          newCursorPos = start + 3 + selectedText.length + 4;
          break;
        case "list":
          newText = beforeText + `\n- ${selectedText}` + afterText;
          newCursorPos = start + 3 + selectedText.length;
          break;
        case "ordered-list":
          newText = beforeText + `\n1. ${selectedText}` + afterText;
          newCursorPos = start + 4 + selectedText.length;
          break;
        case "quote":
          newText = beforeText + `\n> ${selectedText}` + afterText;
          newCursorPos = start + 3 + selectedText.length;
          break;
        case "link":
          newText = beforeText + `[${selectedText}](url)` + afterText;
          newCursorPos = start + selectedText.length + 3;
          break;
        case "code":
          newText = beforeText + `\`${selectedText}\`` + afterText;
          newCursorPos = start + 1 + selectedText.length + 1;
          break;
        case "mention":
          console.log("Opening mention popover via button click");
          // Mở khung chọn thành viên và focus vào khung văn bản
          setShowMentionPopover(true);
          setMentionFilter("");

          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }, 50);
          return;
      }

      onChange(newText);

      // Đặt lại vị trí con trỏ sau khi định dạng
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
            style === "link" ? start + selectedText.length + 3 : newCursorPos,
            style === "link" ? start + selectedText.length + 6 : newCursorPos
          );
        }
      }, 0);
    },
    [value, onChange]
  );

  // Xử lý khi người dùng nhấn vào nút mention member
  const handleMemberClick = useCallback(
    (member: AppwriteDocument) => {
      console.log("Member clicked:", member);

      // Tạo text mention với định dạng @name(id)
      const mentionText = `@${formatMemberName(member)}(${member.$id})`;
      console.log("Generated mention text:", mentionText);

      if (!textareaRef.current) {
        console.error("Textarea reference is null");
        return;
      }

      // Lấy vị trí hiện tại của con trỏ
      const textarea = textareaRef.current;
      const currentPos = textarea.selectionStart;
      console.log("Current cursor position:", currentPos);

      // Lấy nội dung trước và sau vị trí con trỏ
      const textBeforeCursor = value.substring(0, currentPos);
      const textAfterCursor = value.substring(currentPos);
      console.log("Text before cursor:", textBeforeCursor);
      console.log("Text after cursor:", textAfterCursor);

      // Kiểm tra nếu người dùng đã gõ @ trước đó
      const lastAtSymbolPos = textBeforeCursor.lastIndexOf("@");
      console.log("Last @ symbol position:", lastAtSymbolPos);

      let newText;
      let newCursorPos;

      // Nếu người dùng đã gõ @ và không có khoảng trắng sau @ thì thay thế
      if (
        lastAtSymbolPos >= 0 &&
        !textBeforeCursor.substring(lastAtSymbolPos).includes(" ")
      ) {
        // Lấy text trước @
        const textBeforeAt = textBeforeCursor.substring(0, lastAtSymbolPos);
        // Tạo text mới bằng cách thay thế từ @ đến vị trí hiện tại bằng mention
        newText = textBeforeAt + mentionText + " " + textAfterCursor;
        newCursorPos = lastAtSymbolPos + mentionText.length + 1; // +1 cho dấu cách sau mention
        console.log("Replacing existing @ with mention text");
      } else {
        // Nếu không, chỉ chèn mention tại vị trí con trỏ
        newText = textBeforeCursor + mentionText + " " + textAfterCursor;
        newCursorPos = currentPos + mentionText.length + 1; // +1 cho dấu cách sau mention
        console.log("Inserting mention at cursor position");
      }

      console.log("New text to set:", newText);

      // Quan trọng: Đóng popover trước khi thay đổi giá trị
      setShowMentionPopover(false);
      setMentionFilter("");

      // Thay đổi text trong textarea trực tiếp để tránh vấn đề với React state
      textarea.value = newText;

      // Kích hoạt sự kiện để React biết rằng giá trị đã thay đổi
      const event = new Event("input", { bubbles: true });
      textarea.dispatchEvent(event);

      // Gọi hàm onChange từ props để cập nhật state của component cha
      onChange(newText);

      // Đặt lại vị trí con trỏ và focus vào textarea
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      console.log("Cursor position set to:", newCursorPos);
    },
    [value, onChange]
  );

  // Xử lý khi người dùng nhập @ để hiển thị dropdown mention
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      console.log("Key pressed:", e.key);

      if (e.key === "@") {
        console.log("@ key detected, showing mention popover");

        // Ngăn @ được thêm vào textarea tự động bởi React
        e.preventDefault();

        // Lấy vị trí hiện tại của con trỏ
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const beforeText = value.substring(0, start);
        const afterText = value.substring(start);

        // Thêm @ trực tiếp vào text và cập nhật cả UI và state
        const newText = beforeText + "@" + afterText;

        // Cập nhật text trong textarea
        textarea.value = newText;

        // Gửi sự kiện để React biết rằng giá trị đã thay đổi
        const inputEvent = new Event("input", { bubbles: true });
        textarea.dispatchEvent(inputEvent);

        // Cập nhật state thông qua callback
        onChange(newText);

        // Hiển thị popover
        setShowMentionPopover(true);
        setMentionFilter("");

        // Đặt con trỏ sau @
        setTimeout(() => {
          if (textareaRef.current) {
            const newPos = start + 1;
            textareaRef.current.setSelectionRange(newPos, newPos);
          }
        }, 0);
      } else if (e.key === "Escape" && showMentionPopover) {
        console.log("Escape key detected, hiding mention popover");
        e.preventDefault();
        setShowMentionPopover(false);
        setMentionFilter("");
      } else if (showMentionPopover) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          // Ngăn di chuyển con trỏ khi chọn trong dropdown
          console.log("Arrow key detected in popover");
          e.preventDefault();
        } else if (e.key === "Enter" && filteredMembers.length > 0) {
          // Chọn thành viên đầu tiên khi nhấn Enter
          console.log(
            "Enter key detected with members available, selecting first member"
          );
          e.preventDefault();

          // Xử lý trực tiếp thay vì gọi handleMemberClick để tránh vấn đề với event loop
          const member = filteredMembers[0];
          const mentionText = `@${formatMemberName(member)}(${member.$id})`;

          if (!textareaRef.current) return;

          const textarea = textareaRef.current;
          const currentPos = textarea.selectionStart;
          const textBeforeCursor = value.substring(0, currentPos);
          const textAfterCursor = value.substring(currentPos);

          // Kiểm tra nếu người dùng đã gõ @ trước đó
          const lastAtSymbolPos = textBeforeCursor.lastIndexOf("@");

          let newText;
          let newCursorPos;

          if (
            lastAtSymbolPos >= 0 &&
            !textBeforeCursor.substring(lastAtSymbolPos).includes(" ")
          ) {
            const textBeforeAt = textBeforeCursor.substring(0, lastAtSymbolPos);
            newText = textBeforeAt + mentionText + " " + textAfterCursor;
            newCursorPos = lastAtSymbolPos + mentionText.length + 1;
          } else {
            newText = textBeforeCursor + mentionText + " " + textAfterCursor;
            newCursorPos = currentPos + mentionText.length + 1;
          }

          // Đóng popover
          setShowMentionPopover(false);
          setMentionFilter("");

          // Cập nhật textarea trực tiếp
          textarea.value = newText;

          // Kích hoạt sự kiện input
          const event = new Event("input", { bubbles: true });
          textarea.dispatchEvent(event);

          // Cập nhật state
          onChange(newText);

          // Focus và đặt con trỏ
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        } else if (e.key === " " && mentionFilter.length > 0) {
          // Nếu nhấn space sau khi gõ @, và có filter, đóng popover
          console.log("Space key detected after @, closing popover");
          setShowMentionPopover(false);
          setMentionFilter("");
        }
      }
    },
    [
      showMentionPopover,
      filteredMembers,
      handleMemberClick,
      value,
      onChange,
      mentionFilter,
    ]
  );

  // Theo dõi vị trí con trỏ
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setSelectionStart(target.selectionStart);
    setSelectionEnd(target.selectionEnd);
  };

  // Theo dõi nội dung đang nhập để lọc danh sách thành viên
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Lấy vị trí hiện tại của con trỏ
    const currPos = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, currPos);

    // Kiểm tra có gõ @ không và lọc mention
    const mentionMatch = textBeforeCursor.match(/@([^@\s]*)$/);

    if (mentionMatch) {
      console.log("@ detected in input, showing mention popover");
      console.log("Filter text:", mentionMatch[1]);
      setShowMentionPopover(true);
      setMentionFilter(mentionMatch[1]);
    } else if (showMentionPopover) {
      // Đóng popover nếu không còn @ ở vị trí hiện tại
      console.log("No @ detected at current position, closing mention popover");
      setShowMentionPopover(false);
      setMentionFilter("");
    }

    // Lưu lại vị trí con trỏ hiện tại
    setSelectionStart(currPos);
    setSelectionEnd(currPos);
  };

  // Đảm bảo popover đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentionPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (members) {
      // ... existing code ...
    }
  }, [members, handleMemberClick]);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-1 mb-2 bg-muted p-1 rounded-md">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("underline")}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("list")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("ordered-list")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("quote")}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("link")}
          title="Insert Link"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("code")}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => applyStyle("mention")}
          title="Mention a member"
        >
          <AtSign className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClick={handleSelect}
          placeholder={placeholder || "Type your content here..."}
          className={cn(
            "resize-none w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono",
            `min-h-[${minHeight}]`
          )}
          minRows={5}
        />

        {showMentionPopover && members.length > 0 && (
          <div className="absolute z-50 left-0 mt-1 w-64 bg-background rounded-md border shadow-md">
            <ScrollArea className="h-52">
              <div className="p-2">
                <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
                  <span>
                    {mentionFilter
                      ? `Search results for "${mentionFilter}"`
                      : "Mention members"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 -mr-1"
                    onClick={() => setShowMentionPopover(false)}
                    title="Close"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </Button>
                </h4>
                {filteredMembers.length > 0 ? (
                  <div className="space-y-1">
                    {filteredMembers.map((member: AppwriteDocument) => (
                      <Button
                        key={member.$id}
                        variant="ghost"
                        className="w-full justify-start text-sm h-auto py-2 hover:bg-primary/10 transition-colors active:scale-95"
                        onClick={() => handleMemberClick(member)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {member.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="flex-1 text-left">
                            {formatMemberName(member)}
                          </span>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground flex-shrink-0">
                            Click to add
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No members found
                  </p>
                )}
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                  <p>Press Enter to select or Escape to cancel</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Sử dụng Markdown để định dạng: **đậm**, *nghiêng*, # Heading, - List,
        @mention, ...
      </div>
    </div>
  );
}
