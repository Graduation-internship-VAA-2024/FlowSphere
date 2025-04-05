import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Messages } from "../type";
import { useMemo, useEffect, useState } from "react";
import { FileText, Image as ImageIcon, FileArchive, File as FileIcon, Headphones, Video, Code, Download } from "lucide-react";
import { MessageReadStatus } from "./message-read-status";
import { bytesToSize } from "@/lib/utils";
import { ImageViewer } from "./image-viewer";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: Messages;
  currentMemberId: string;
  memberName?: string;
  chatsId: string;
  id?: string;
  totalMembers?: number;
  allMessages?: Messages[];
  highlighted?: boolean;
}

// Function to get appropriate icon based on file type
const getFileIcon = (fileType: string | undefined) => {
  if (!fileType) return <FileIcon className="h-4 w-4" />;
  
  if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (fileType.startsWith('audio/')) return <Headphones className="h-4 w-4" />;
  
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
  if (fileType.includes('word') || fileType.includes('doc')) return <FileText className="h-4 w-4" />;
  if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('csv')) return <FileText className="h-4 w-4" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return <FileArchive className="h-4 w-4" />;
  if (fileType.includes('json') || fileType.includes('javascript') || fileType.includes('html') || fileType.includes('css')) return <Code className="h-4 w-4" />;
  
  return <FileIcon className="h-4 w-4" />;
};

export const ChatMessage = ({ 
  message, 
  currentMemberId, 
  memberName,
  totalMembers = 1,
  chatsId,
  allMessages = [],
  highlighted = false
}: ChatMessageProps) => {
  const [senderName, setSenderName] = useState<string>(memberName || "");
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const isCurrentUser = useMemo(() => {
    return message.memberId === currentMemberId;
  }, [message.memberId, currentMemberId]);

  // Tìm tất cả ảnh trong cuộc trò chuyện
  const allImages = useMemo(() => {
    return allMessages
      .filter(msg => msg.imageUrl)
      .map(msg => msg.imageUrl as string);
  }, [allMessages]);

  // Tìm index của ảnh hiện tại trong tất cả các ảnh
  const currentImageIndex = useMemo(() => {
    if (!message.imageUrl || allImages.length === 0) return 0;
    return allImages.indexOf(message.imageUrl) || 0;
  }, [message.imageUrl, allImages]);

  // Format date for message timestamp
  const formattedTime = useMemo(() => {
    const dateToFormat = message.createdAt || message.CreatedAt || message.$createdAt;
    if (!dateToFormat) return "";
    
    try {
      return format(new Date(dateToFormat), 'HH:mm', { locale: vi });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  }, [message.createdAt, message.CreatedAt, message.$createdAt]);

  useEffect(() => {
    if (!memberName && message.memberId && !isCurrentUser) {
      const fetchMemberName = async () => {
        try {
          const response = await fetch(`/api/members/${message.memberId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.name) {
              setSenderName(data.data.name);
            } else {
              setSenderName("Người dùng");
            }
          }
        } catch (error) {
          console.error("Error fetching member details:", error);
          setSenderName("Người dùng");
        }
      };

      fetchMemberName();
    } else if (isCurrentUser) {
      setSenderName("Bạn");
    } else if (memberName) {
      setSenderName(memberName);
    }
  }, [message.memberId, memberName, isCurrentUser]);

  // Xác định trạng thái ban đầu của tin nhắn
  const getInitialMessageStatus = () => {
    // Nếu là tin nhắn tạm thời (đang gửi)
    if (message.$id?.startsWith('temp-')) {
      return 'sending';
    }
    // Nếu có $id thật nghĩa là đã gửi thành công
    return 'sent';
  };

  // Hàm xử lý tải file
  const handleDownload = (url: string, fileName: string) => {
    try {
      // Sử dụng fetch để tải file (hoạt động tốt hơn với file từ API)
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          // Tạo URL object từ blob
          const blobUrl = URL.createObjectURL(blob);
          
          // Tạo một thẻ a tạm thời để tải xuống
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName || 'file';
          document.body.appendChild(link);
          link.click();
          
          // Dọn dẹp
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 100);
        })
        .catch(error => {
          console.error("Lỗi khi tải file:", error);
          // Fallback nếu fetch không hoạt động
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || 'file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    } catch (error) {
      console.error("Lỗi khi tải file:", error);
      // Fallback cho trường hợp lỗi
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Mở ảnh
  const openImageViewer = () => {
    if (message.imageUrl) {
      console.log("Opening image viewer for:", message.imageUrl);
      setSelectedImage(message.imageUrl);
      setViewerOpen(true);
    }
  };

  return (
    <div className={cn(
      "flex gap-2 mb-4",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className="flex-shrink-0 mt-1">
        <Avatar className="h-8 w-8">
          <div className="bg-primary text-white w-full h-full flex items-center justify-center text-xs font-medium uppercase">
            {senderName?.charAt(0) || "U"}
          </div>
        </Avatar>
      </div>
      
      <div className={cn(
        "flex flex-col max-w-[75%]",
        isCurrentUser ? "items-end" : "items-start"
      )}>
        {/* Tên người gửi chỉ hiển thị với tin nhắn từ người khác */}
        {!isCurrentUser && (
          <span className="text-xs font-semibold mb-1 text-muted-foreground px-1">{senderName}</span>
        )}
        
        <div className={cn(
          "rounded-lg shadow-sm overflow-hidden",
          isCurrentUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-muted rounded-tl-none",
          message.imageUrl && !message.content ? "p-0" : "p-3"
        )}>
          {/* Nội dung tin nhắn */}
          {message.content && (
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
          
          {/* Hiển thị ảnh đính kèm - thiết kế giống Messenger */}
          {message.imageUrl && (
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "relative group cursor-pointer",
                  message.content ? "mt-2" : ""
                )}
                onClick={openImageViewer}
              >
                <img 
                  src={message.imageUrl} 
                  alt="Hình ảnh đính kèm" 
                  className={cn(
                    "object-cover",
                    !message.content ? "w-full rounded-lg max-w-[240px]" : "w-full rounded-md max-w-[240px]"
                  )}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.naturalHeight > 300) {
                      target.style.maxHeight = "300px";
                    }
                  }}
                />
                
                {/* Overlay với các nút xem và tải xuống */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 bg-black/40 rounded-lg">
                  {/* Nút xem ảnh */}
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 border border-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        openImageViewer();
                      }}
                      title="Xem ảnh"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </Button>
                    <span className="text-white text-xs mt-1 font-medium bg-black/40 px-2 py-0.5 rounded-md">Xem</span>
                  </div>
                  
                  {/* Nút tải xuống */}
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 border border-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (message.imageUrl) {
                          handleDownload(message.imageUrl, message.fileName || "image.jpg");
                        }
                      }}
                      title="Tải xuống ảnh"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </Button>
                    <span className="text-white text-xs mt-1 font-medium bg-black/40 px-2 py-0.5 rounded-md">Tải xuống</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Hiển thị file đính kèm */}
          {message.fileUrl && !message.imageUrl && (
            <div className="flex flex-col">
              <div 
                className="bg-background rounded-md p-3 border relative group cursor-pointer"
                onClick={() => handleDownload(message.fileUrl!, message.fileName || 'file')}
              >
                <div className="flex items-center gap-2 max-w-[200px]">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(message.fileType)}
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium truncate">
                      {message.fileName || "File đính kèm"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {message.fileSize ? bytesToSize(message.fileSize) : ""}
                    </div>
                  </div>
                </div>
                
                {/* Overlay khi hover vào file */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 bg-black/40 rounded-md">
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 border border-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(message.fileUrl!, message.fileName || 'file');
                      }}
                      title="Tải xuống"
                    >
                      <Download className="h-4 w-4 text-white" />
                    </Button>
                    <span className="text-white text-xs mt-1 font-medium bg-black/40 px-2 py-0.5 rounded-md">Tải xuống</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Thời gian gửi tin nhắn và trạng thái */}
        <div className="flex items-center text-[10px] text-muted-foreground mt-1 px-1">
          <span>{formattedTime}</span>
          
          {/* Hiển thị trạng thái chỉ cho tin nhắn của người dùng hiện tại */}
          {isCurrentUser && chatsId && (
            <MessageReadStatus 
              messageId={message.$id || ''}
              chatsId={chatsId}
              memberId={currentMemberId}
              totalMembers={totalMembers}
              createdAt={(message.CreatedAt || message.$createdAt || new Date().toISOString()).toString()}
              status={getInitialMessageStatus() as "read" | "sent" | "delivered" | undefined}
            />
          )}
        </div>
      </div>
      
      {/* Image Viewer phong cách Messenger */}
      {viewerOpen && selectedImage && (
        <ImageViewer 
          isOpen={viewerOpen}
          imageUrl={selectedImage}
          onClose={() => {
            console.log("Closing image viewer");
            setViewerOpen(false);
          }}
          allImages={allImages}
          currentIndex={currentImageIndex}
        />
      )}
    </div>
  );
};