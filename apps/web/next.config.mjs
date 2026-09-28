/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@dikidi/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
