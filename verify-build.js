// Simple script to verify that the build process works
const { execSync } = require('child_process');

try {
  console.log('Running Next.js build to verify deployment readiness...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('Build completed successfully! Your app should deploy without issues.');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 