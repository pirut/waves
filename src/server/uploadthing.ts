import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { adminAuth, isFirebaseInitialized } from "@/firebaseAdmin";

const f = createUploadthing();

// Auth function to verify user
const auth = async (req: Request): Promise<{ id: string; email?: string }> => {
  if (!isFirebaseInitialized() || !adminAuth) {
    throw new UploadThingError("Firebase not initialized");
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UploadThingError("Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { id: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error("Auth error:", error);
    throw new UploadThingError("Unauthorized");
  }
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Event image uploader
  eventImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth(req);

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id, userEmail: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Return metadata to be stored with the event
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),

  // User avatar uploader
  avatarUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;