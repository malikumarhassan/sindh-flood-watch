import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = {
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@sfw/shared"],
  async rewrites() {
    const upstream = process.env.API_UPSTREAM_URL;
    if (!upstream) return [];
    const target = new URL(upstream);
    if (
      target.protocol !== "https:" ||
      target.username ||
      target.password ||
      target.pathname !== "/" ||
      target.search ||
      target.hash
    ) {
      throw new Error("API_UPSTREAM_URL must be a bare public HTTPS origin");
    }
    return [{ source: "/api/:path*", destination: `${target.origin}/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
