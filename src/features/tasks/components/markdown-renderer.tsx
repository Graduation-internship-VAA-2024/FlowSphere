"use client";

import { FC } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: FC<MarkdownRendererProps> = ({
  content,
  className,
}) => {
  return (
    <div className={cn("prose prose-slate max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ node, ...props }) => {
            const isFileLink = props.href?.startsWith(
              "https://cloud.appwrite.io/v1/storage/buckets"
            );

            if (isFileLink) {
              return (
                <a
                  {...props}
                  href={props.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Paperclip className="size-4" />
                  {props.children}
                </a>
              );
            }

            return (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              />
            );
          },
          img: ({ node, ...props }) => {
            // For task image previews
            if (
              props.src &&
              (props.src.startsWith("data:image") ||
                props.src.includes("cloud.appwrite.io/v1/storage/buckets"))
            ) {
              return (
                <div className="my-4 relative rounded-lg overflow-hidden border">
                  <img
                    {...props}
                    className="max-w-full h-auto"
                    alt={props.alt || "Image"}
                  />
                </div>
              );
            }

            return (
              <img {...props} className="max-w-full h-auto rounded-md my-2" />
            );
          },
          h1: ({ node, ...props }) => (
            <h1 {...props} className="text-2xl font-bold mt-6 mb-4" />
          ),
          h2: ({ node, ...props }) => (
            <h2 {...props} className="text-xl font-bold mt-5 mb-3" />
          ),
          p: ({ node, ...props }) => <p {...props} className="mb-4" />,
          ul: ({ node, ...props }) => (
            <ul {...props} className="list-disc pl-6 mb-4" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="list-decimal pl-6 mb-4" />
          ),
          li: ({ node, ...props }) => <li {...props} className="mb-1" />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className="border-l-4 border-gray-300 pl-4 italic my-4"
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
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
          pre: ({ node, ...props }) => (
            <pre
              {...props}
              className="bg-gray-100 p-2 rounded-md overflow-x-auto my-4"
            />
          ),
          hr: ({ node, ...props }) => (
            <hr {...props} className="my-6 border-t border-gray-200" />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table {...props} className="border-collapse table-auto w-full" />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead {...props} className="bg-gray-50" />
          ),
          tbody: ({ node, ...props }) => (
            <tbody {...props} className="divide-y divide-gray-200" />
          ),
          tr: ({ node, ...props }) => (
            <tr {...props} className="hover:bg-gray-50" />
          ),
          th: ({ node, ...props }) => (
            <th
              {...props}
              className="px-3 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"
            />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="px-3 py-2 text-sm" />
          ),
        }}
      >
        {content || "No description provided"}
      </ReactMarkdown>
    </div>
  );
};
