'use client';

import { useEffect, useState } from "react";
import { SidePanelChat } from "@/components/ChatBot/SidePanelChat";

export const ClientLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {children}
      {isMounted && <SidePanelChat />}
    </>
  );
}; 