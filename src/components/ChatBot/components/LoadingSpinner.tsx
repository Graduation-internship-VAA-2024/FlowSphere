'use client';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

/**
 * Component hiển thị animation loading dạng 3 chấm
 * @param size - Kích thước của loading spinner (small/medium/large)
 */
export const LoadingSpinner = ({ size = 'medium' }: LoadingSpinnerProps) => {
  // Xác định kích thước dựa vào prop size
  const dotSize = {
    small: 'w-1.5 h-1.5',
    medium: 'w-2 h-2',
    large: 'w-3 h-3'
  }[size];

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex space-x-2 items-center">
        {/* Tạo 3 chấm với animation pulse và delay khác nhau */}
        <div className={`${dotSize} rounded-full bg-gray-400 animate-pulse`}></div>
        <div className={`${dotSize} rounded-full bg-gray-400 animate-pulse delay-75`}></div>
        <div className={`${dotSize} rounded-full bg-gray-400 animate-pulse delay-150`}></div>
      </div>
    </div>
  );
};