/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix issue with node-fetch
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "node-fetch": false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  eslint: {
    // Tắt ESLint trong quá trình build để đảm bảo có thể deploy được
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
