/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sendinblue/client'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      request: false,
      child_process: false,
    };
    return config;
  },
};

export default nextConfig;
