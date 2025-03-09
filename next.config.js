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