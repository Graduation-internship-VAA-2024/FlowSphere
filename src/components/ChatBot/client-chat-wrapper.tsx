"use client";

import { FloatingChatButton } from "./FloatingChatButton";
import { KeyboardShortcut } from "./KeyboardShortcut";

export function ClientChatWrapper() {
  return (
    <>
      <FloatingChatButton />
      <KeyboardShortcut />
    </>
  );
}
