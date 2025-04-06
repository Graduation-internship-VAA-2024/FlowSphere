"use client";

import { FC, useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: FC<MarkdownRendererProps> = ({
  content,
  className,
}) => {
  const [processedContent, setProcessedContent] = useState(content);
  const workspaceId = useWorkspaceId();
  const { data: membersData } = useGetMembers({ workspaceId });

  // Sử dụng useMemo để tránh re-render không cần thiết
  const members = useMemo(() => membersData?.documents || [], [membersData]);

  // Xử lý mention và underline
  useEffect(() => {
    if (!content) {
      console.log("No content available");
      return;
    }

    console.log("Processing content:", content);

    // Xử lý và thay thế nhiều loại định dạng đặc biệt
    let newContent = content;

    // 1. Xử lý underline tags
    newContent = newContent.replace(
      /<u>(.*?)<\/u>/g,
      (match, text) => `<span class="underline">${text}</span>`
    );

    // 2. Pattern bắt các thẻ mention: @name(id)
    if (members.length > 0) {
      const mentionPattern = /@([^(]+)\(([^)]+)\)/g;

      // Tìm tất cả các kết quả khớp
      const matches = Array.from(newContent.matchAll(mentionPattern));
      if (matches.length > 0) {
        console.log("Found mentions:", matches);
        for (const match of matches) {
          console.log(
            "Matching mention:",
            match[0],
            "Name:",
            match[1],
            "ID:",
            match[2]
          );
        }
      }

      // Thay thế các thẻ mention bằng HTML sẽ hiển thị
      newContent = newContent.replace(mentionPattern, (match, name, id) => {
        // Tìm member trong danh sách theo $id
        const member = members.find((m) => m.$id === id);
        console.log(
          `Checking mention: @${name}(${id})`,
          member ? "Found member" : "Member not found"
        );

        if (member) {
          // Nếu tìm thấy, tạo span với định dạng mention và màu nổi bật hơn
          return `<span class="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-sm font-medium">@${name}</span>`;
        }

        // Nếu không tìm thấy, giữ nguyên text
        return match;
      });
    }

    console.log("Processed content:", newContent);
    setProcessedContent(newContent);
  }, [content, members]);

  return (
    <div
      className={cn(
        "prose prose-slate max-w-none dark:prose-invert",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Cho phép HTML được render
          p: ({ children, ...props }) => {
            // Biến đổi children thành string an toàn
            let content = "";
            try {
              if (children) {
                // Nối tất cả children lại nếu là mảng
                if (Array.isArray(children)) {
                  content = children
                    .map((child) => (typeof child === "string" ? child : ""))
                    .join("");
                } else if (typeof children === "string") {
                  content = children;
                }
              }
            } catch (e) {
              console.error("Error processing markdown content:", e);
            }

            // Kiểm tra xem có HTML không
            const hasHtml =
              content.includes("<span") || content.includes("<u>");

            if (hasHtml) {
              return (
                <p
                  {...props}
                  className="mb-4"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              );
            }

            return (
              <p {...props} className="mb-4">
                {children}
              </p>
            );
          },

          // Customize heading styles
          h1: (props) => (
            <h1 {...props} className="text-2xl font-bold mt-6 mb-4" />
          ),
          h2: (props) => (
            <h2 {...props} className="text-xl font-bold mt-5 mb-3" />
          ),
          h3: (props) => (
            <h3 {...props} className="text-lg font-bold mt-4 mb-2" />
          ),

          // Customize list styles
          ul: (props) => <ul {...props} className="list-disc pl-6 mb-4" />,
          ol: (props) => <ol {...props} className="list-decimal pl-6 mb-4" />,
          li: (props) => <li {...props} className="mb-1" />,

          // Customize blockquote style
          blockquote: (props) => (
            <blockquote
              {...props}
              className="border-l-4 border-gray-300 pl-4 italic my-4"
            />
          ),

          // Customize code and pre styles
          code: ({ className, children, ...props }) => {
            const inline = !className;

            return !inline ? (
              <pre className="p-2 bg-gray-100 rounded-md overflow-x-auto my-4">
                <code {...props} className={className}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                {...props}
                className="px-1 py-0.5 bg-gray-100 rounded text-sm"
              >
                {children}
              </code>
            );
          },

          // Ensure pre is styled correctly
          pre: (props) => (
            <pre
              {...props}
              className="bg-gray-100 p-2 rounded-md overflow-x-auto my-4"
            />
          ),

          // Add styles for other elements
          a: (props) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            />
          ),
          img: (props) => (
            // Sử dụng img thay vì Image từ next/image vì nội dung có thể từ nguồn không tin cậy
            // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
            <img
              {...props}
              alt={props.alt || ""}
              className="max-w-full h-auto rounded-md my-2"
            />
          ),
          hr: (props) => (
            <hr {...props} className="my-6 border-t border-gray-200" />
          ),

          // Table styles
          table: (props) => (
            <div className="overflow-x-auto my-4">
              <table {...props} className="border-collapse table-auto w-full" />
            </div>
          ),
          thead: (props) => <thead {...props} className="bg-gray-50" />,
          tbody: (props) => (
            <tbody {...props} className="divide-y divide-gray-200" />
          ),
          tr: (props) => <tr {...props} className="hover:bg-gray-50" />,
          th: (props) => (
            <th
              {...props}
              className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
            />
          ),
          td: (props) => <td {...props} className="px-3 py-2 text-sm" />,
        }}
      >
        {processedContent || "No description provided"}
      </ReactMarkdown>
    </div>
  );
};
