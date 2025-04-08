import { DATABASE_ID, MEMBERS_ID } from "@/config";
import { Databases, Query } from "node-appwrite";

interface GetMemberProps {
  databases: Databases;
  userId: string;
  workspaceId: string;
}

export const getMember = async ({
  databases,
  userId,
  workspaceId,
}: GetMemberProps) => {
  const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
    Query.equal("workspaceId", workspaceId),
    Query.equal("userId", userId),
  ]);
  return members.documents[0];
};

// Format member name with fallback to email or "Unknown User"
export const formatMemberName = (member?: {
  name?: string;
  email?: string;
  $id?: string;
}): string => {
  if (!member) return "Unknown User";
  return member.name || member.email || "Unknown User";
};

// Get member short name or initials for avatars
export const getMemberInitials = (member?: {
  name?: string;
  email?: string;
}): string => {
  if (!member) return "?";

  // If name exists, get first letter of each word
  if (member.name) {
    return member.name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  // If only email exists, use first letter
  if (member.email) {
    return member.email.charAt(0).toUpperCase();
  }

  return "?";
};
