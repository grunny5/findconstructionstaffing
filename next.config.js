/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
  typescript: {
    // Use a separate tsconfig for builds that excludes scripts
    tsconfigPath: './tsconfig.build.json',
  },
};

module.exports = nextConfig;
