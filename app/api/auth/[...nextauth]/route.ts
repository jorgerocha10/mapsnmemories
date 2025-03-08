import { handlers } from "@/auth"

// Explicitly use Node.js runtime, not Edge
export const runtime = "nodejs"

export const { GET, POST } = handlers 