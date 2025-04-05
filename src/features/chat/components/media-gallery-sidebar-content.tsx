import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Messages } from "../type";
import { Button } from "@/components/ui/button";
import { Download, File, Image as ImageIcon } from "lucide-react";
import { bytesToSize } from "@/lib/utils";
import { ImageViewer } from "./image-viewer";
import { cn } from "@/lib/utils";

interface MediaGallerySidebarContentProps {
  messages: Messages[];
  chatsId: string;
}

export const MediaGallerySidebarContent = ({ messages, chatsId }: MediaGallerySidebarContentProps) => {
  const [selectedTab, setSelectedTab] = useState<"images" | "files">("images");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Lọc ra tất cả các tin nhắn có ảnh
  const imagesMessages = useMemo(() => {
    return messages.filter(message => message.imageUrl).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.CreatedAt || a.$createdAt || 0);
      const dateB = new Date(b.createdAt || b.CreatedAt || b.$createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [messages]);
  
  // Lọc ra tất cả các tin nhắn có file (không phải ảnh)
  const filesMessages = useMemo(() => {
    return messages.filter(message => message.fileUrl && !message.imageUrl).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.CreatedAt || a.$createdAt || 0);
      const dateB = new Date(b.createdAt || b.CreatedAt || b.$createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [messages]);

  // Xử lý tải file xuống
  const handleDownload = (url: string, fileName: string) => {
    try {
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName || 'file';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 100);
        })
        .catch(error => {
          console.error("Lỗi khi tải file:", error);
          window.open(url, '_blank');
        });
    } catch (error) {
      console.error("Lỗi khi tải file:", error);
      window.open(url, '_blank');
    }
  };

  // Mở ảnh để xem
  const openImageViewer = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  return (
    <>
      <Tabs defaultValue="images" value={selectedTab} onValueChange={(value) => setSelectedTab(value as "images" | "files")} className="h-full flex flex-col">
        <div className="px-3 py-2 border-b">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Ảnh ({imagesMessages.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              Tệp ({filesMessages.length})
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="images" className="flex-1 overflow-hidden m-0 focus-visible:outline-none focus-visible:ring-0">
          <ScrollArea className="h-full">
            {imagesMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                <ImageIcon className="h-16 w-16 opacity-20 mb-4" />
                <p className="text-center text-sm">Chưa có ảnh nào được chia sẻ trong cuộc trò chuyện này</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3">
                {imagesMessages.map((message) => (
                  <div 
                    key={message.$id} 
                    className="relative group rounded-lg overflow-hidden aspect-square cursor-pointer"
                    onClick={() => openImageViewer(message.imageUrl!)}
                  >
                    <img 
                      src={message.imageUrl} 
                      alt={message.fileName || "Ảnh"} 
                      className="object-cover w-full h-full"
                    />
                    
                    {/* Overlay khi hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(message.imageUrl!, message.fileName || 'image.jpg');
                        }}
                      >
                        <Download className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="files" className="flex-1 overflow-hidden m-0 focus-visible:outline-none focus-visible:ring-0">
          <ScrollArea className="h-full">
            {filesMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                <File className="h-16 w-16 opacity-20 mb-4" />
                <p className="text-center text-sm">Chưa có tệp nào được chia sẻ trong cuộc trò chuyện này</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-3">
                {filesMessages.map((message) => (
                  <div 
                    key={message.$id} 
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <File className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {message.fileName || "Tệp đính kèm"}
                      </p>
                      {message.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {bytesToSize(message.fileSize)}
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleDownload(message.fileUrl!, message.fileName || 'file')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer 
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
          images={imagesMessages.map(msg => msg.imageUrl!)}
          currentIndex={imagesMessages.findIndex(msg => msg.imageUrl === selectedImage)}
        />
      )}
    </>
  );
}; 