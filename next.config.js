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
};

module.exports = nextConfig; 