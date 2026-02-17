import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/.well-known/farcaster.json",
        destination:
          "https://api.farcaster.xyz/miniapps/hosted-manifest/019c6c10-5450-39f1-b978-2ebf34e75f78",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
