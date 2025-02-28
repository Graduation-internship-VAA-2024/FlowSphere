import { cn } from "@/lib/utils";

interface DottedSeparatorProps {
  className?: string;
  height?: string;
  dotSize?: string;
  gapSize?: string;
  direction?: "horizontal" | "vertical";
}

export const DottedSeparator = ({
  className,
  height = "3px",
  dotSize = "3px",
  gapSize = "8px",
  direction = "horizontal",
}: DottedSeparatorProps) => {
  const isHorizontal = direction === "horizontal";

  const colors = [
    "rgba(0,122,255,0.8)", // Blue
    "rgba(255,45,85,0.8)", // Red
    "rgba(88,86,214,0.8)", // Purple
    "rgba(52,199,89,0.8)", // Green
    "rgba(255,149,0,0.8)", // Orange
    "rgba(175,82,222,0.8)", // Pink
    "rgba(90,200,250,0.8)", // Light Blue
    "rgba(255,204,0,0.8)", // Yellow
    "rgba(76,217,100,0.8)", // Light Green
    "rgba(255,59,48,0.8)", // Bright Red
    "rgba(142,142,147,0.8)", // Gray
    "rgba(0,199,190,0.8)", // Teal
  ];

  const getBackgroundStyle = () => {
    return colors
      .map(
        (color, index) =>
          `radial-gradient(circle, ${color} 25%, transparent 25%)`
      )
      .join(", ");
  };

  return (
    <div
      className={cn(
        isHorizontal
          ? "w-full flex items-center"
          : "h-full flex flex-col items-center",
        "relative",
        className
      )}
    >
      <div
        className={cn(
          isHorizontal ? "flex-grow" : "flex-grow-0",
          "transition-all duration-300"
        )}
        style={{
          width: isHorizontal ? "100%" : height,
          height: isHorizontal ? height : "100%",
          backgroundImage: getBackgroundStyle(),
          backgroundSize: isHorizontal
            ? `${
                (parseInt(dotSize) + parseInt(gapSize)) * colors.length
              }px ${height}`
            : `${height} ${
                (parseInt(dotSize) + parseInt(gapSize)) * colors.length
              }px`,
          backgroundRepeat: isHorizontal ? "repeat-x" : "repeat-y",
          backgroundPosition: colors
            .map(
              (_, index) =>
                `calc(${index * (100 / colors.length)}% + ${
                  index * parseInt(gapSize)
                }px) center`
            )
            .join(", "),
        }}
      />
    </div>
  );
};
