"use client";
import Image from "next/image";
import Link from "next/link";
import { DottedSeparator } from "./dotted-separator";
import { Navigation } from "./navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Projects } from "./projects";

export const Sidebar = () => {
  return (
    <aside className="h-full  p-4 bg-neutral-50 shadow-lg">
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
      <WorkspaceSwitcher />
      <DottedSeparator className="my-6 opacity-50" />
      <Navigation />
      <DottedSeparator className="my-6 opacity-50" />
      <Projects />
    </aside>
  );
};
