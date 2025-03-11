/** @type {import('next').NextConfig} */
const nextConfig = {
  // Define packages that should be treated as external in server components
  serverExternalPackages: ['bcryptjs'],
  
  // Configure experimental features
  experimental: {
    // Configure server actions with proper object structure if needed
    // serverActions: {
    //   bodySizeLimit: '2mb',
    // },
  },

  // Ensure client-side navigations work correctly
  trailingSlash: false,
  reactStrictMode: true,

  // Include environment variables that should be accessible on the client
  env: {
    UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
    UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
  },

  // Configure image domains for Next.js Image component
  images: {
    domains: [
      'r2aruz9pi6.ufs.sh', // UploadThing domain
      'utfs.io', // Alternative UploadThing domain
    ],
  },

  // Disable TypeScript errors during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable ESLint errors during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 