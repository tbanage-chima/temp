/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    // swcMinify: true,
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "cdn.getphyllo.com",
        },
      ],
    },
  };
  
  export default nextConfig;
  