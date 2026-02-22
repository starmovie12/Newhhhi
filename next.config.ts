import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
};

export default config;
