import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createWorkspaceSchema } from "../schema";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, IMAGES_BUCKET_ID, WORKSPACES_ID } from "@/config";
import { ID } from "node-appwrite";
const app = new Hono().post(
  "/",
  zValidator("form", createWorkspaceSchema),
  sessionMiddleware,
  async (c) => {
    const database = c.get("databases");
    const storage = c.get("storage");
    const user = c.get("user");
    const { name, image } = c.req.valid("form");
    let uploadedImageUrl: string | undefined = undefined;
    if (image instanceof File) {
      const file = await storage.createFile(
        IMAGES_BUCKET_ID,
        ID.unique(),
        image
      );
      const arrayBuffer = await storage.getFileView(IMAGES_BUCKET_ID, file.$id);
      uploadedImageUrl = `data:image/png;base64,${Buffer.from(
        arrayBuffer
      ).toString("base64")}`;
    }
    const workspace = await database.createDocument(
      DATABASE_ID,
      WORKSPACES_ID,
      ID.unique(),
      {
        name,
        userId: user.$id,
        imageURL: uploadedImageUrl,
      }
    );
    return c.json({ data: workspace });
  }
);
export default app;
