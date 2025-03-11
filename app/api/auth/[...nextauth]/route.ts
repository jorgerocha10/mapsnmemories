import { handlers } from "@/auth"

// Explicitly use Node.js runtime, not Edge
export const runtime = "nodejs"

// Export the handler functions directly
export const { GET, POST } = handlers 