import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  allImages?: string[];
  currentIndex?: number;
}

export function ImageViewer({ 
  isOpen, 
  onClose, 
  imageUrl, 
  allImages = [], 
  currentIndex = 0 
}: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);

  // Reset zoom and rotation when changing images
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setCurrentImageIndex(currentIndex);
  }, [imageUrl, currentIndex]);

  // Tạo hàm để lấy URL của ảnh hiện tại
  const getCurrentImageUrl = () => {
    if (allImages.length > 0 && currentImageIndex >= 0 && currentImageIndex < allImages.length) {
      return allImages[currentImageIndex];
    }
    return imageUrl;
  };

  // Hàm để chuyển đến ảnh trước
  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allImages.length > 1 && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setScale(1);
      setRotation(0);
    }
  };

  // Hàm để chuyển đến ảnh tiếp theo
  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allImages.length > 1 && currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setScale(1);
      setRotation(0);
    }
  };

  // Hàm xử lý tải xuống ảnh
  const handleDownload = () => {
    const imgUrl = getCurrentImageUrl();
    if (!imgUrl) return;

    fetch(imgUrl)
      .then(response => response.blob())
      .then(blob => {
        // Tạo URL object từ blob
        const blobUrl = URL.createObjectURL(blob);
        
        // Lấy tên file từ URL hoặc dùng tên mặc định
        const fileName = imgUrl.split('/').pop() || 'image.jpg';
        
        // Tạo một thẻ a tạm thời để tải xuống
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Dọn dẹp
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch(error => {
        console.error("Lỗi khi tải ảnh:", error);
      });
  };

  if (!imageUrl && allImages.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-screen-lg w-[95vw] h-[90vh] p-0 overflow-hidden bg-black/95 border-none sm:rounded-xl">
        {/* Thanh công cụ phía trên */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            {/* Vị trí ảnh hiện tại */}
            {allImages.length > 1 && (
              <span className="text-white text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Nút phóng to */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setScale(scale + 0.2)}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            
            {/* Nút thu nhỏ */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setScale(Math.max(0.5, scale - 0.2))}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            
            {/* Nút xoay */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setRotation(rotation + 90)}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            
            {/* Nút tải xuống */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleDownload}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
            >
              <Download className="h-5 w-5" />
            </Button>
            
            {/* Nút đóng */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Nút điều hướng */}
        {allImages.length > 1 && (
          <>
            {/* Nút trước */}
            {currentImageIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-full"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            
            {/* Nút tiếp theo */}
            {currentImageIndex < allImages.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 bg-white/10 hover:bg-white/20 text-white rounded-full"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </>
        )}
        
        {/* Vùng hiển thị ảnh */}
        <div className="h-full w-full flex items-center justify-center p-8 overflow-hidden">
          <img
            src={getCurrentImageUrl() || ''}
            alt="Hình ảnh đính kèm"
            className="object-contain max-h-full max-w-full transition-transform duration-200"
            style={{ 
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              pointerEvents: 'auto'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 