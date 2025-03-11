import { generateReactHelpers } from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Generate type-safe React components for handling file uploads
// Note: The error handling happens in the component that uses these hooks
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>(); 