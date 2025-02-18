"use client";
import Image from "next/image";
import Link from "next/link";
import { DottedSeparator } from "./dotted-separator";
import { Navigation } from "./navigation";

export const Sidebar = () => {
  return (
    <aside className="h-full  p-6 bg-neutral-50 shadow-lg">
      <div className="hover:scale-105 transition-transform">
        <Link href="/" className="block">
          <Image
            src="/logo.svg"
            alt="logo"
            width={164}
            height={48}
            className="drop-shadow-md"
          />
        </Link>
      </div>
      <DottedSeparator className="my-6 opacity-50" />
      <Navigation />
    </aside>
  );
};
