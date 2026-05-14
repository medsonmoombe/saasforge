/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.107.201.7"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
