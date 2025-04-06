import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInviteCode(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function snakeCaseToTitleCase(str: string) {
  return str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Utility function to download a file from a URL
 */
export function download(url: string, filename: string) {
  // Create an anchor element
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";

  // Append to the DOM to enable click
  document.body.appendChild(a);

  // Trigger click event
  a.click();

  // Cleanup
  document.body.removeChild(a);
}
