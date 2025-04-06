export interface User {
  $id: string;
  name: string;
  email: string;
  // Add any other user properties that might be in the Appwrite user object
  $createdAt: string;
  $updatedAt: string;
}
