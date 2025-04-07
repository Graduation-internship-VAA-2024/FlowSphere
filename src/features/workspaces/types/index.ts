// ...existing types...

export interface InviteWorkspaceRequest {
  workspaceId: string;
  email: string;
}

export interface InviteWorkspaceResponse {
  success: boolean;
}
