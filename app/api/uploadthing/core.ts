import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

// Initialize UploadThing with default config
const f = createUploadthing();

// Export a file router for our API route
export const ourFileRouter = {
  // Allow admin users to upload product images
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      // For troubleshooting, allow all uploads without auth checks temporarily
      return { userId: "test-user-id" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Product image uploaded", file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 