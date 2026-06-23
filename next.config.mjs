/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
      },
    ],
  },
  experimental: {
    // Tree-shake barrel imports of heavy icon/animation libs so dev only
    // compiles the icons/components actually used. Cuts the dev module count
    // and the production bundle size.
    optimizePackageImports: [
      "react-material-symbols",
      "@icons-pack/react-simple-icons",
      "framer-motion",
    ],
    // receipt.pdf is read from disk at runtime by these routes; without this,
    // Vercel's serverless tracer won't bundle it and the read fails in prod.
    outputFileTracingIncludes: {
      "/api/receipt": ["./receipt.pdf"],
      "/api/admin/receipt": ["./receipt.pdf"],
      "/api/cron/archive": ["./receipt.pdf"],
    },
  },
};

export default nextConfig;
