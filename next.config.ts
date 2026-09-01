import type { NextConfig } from "next";

// STATIC_EXPORT=1 时输出 GitHub Pages 静态站（npm run build:static / CI 部署用），
// 其余情况保持原有 standalone 输出（服务器 / APK 构建流程不受影响）
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        basePath: "/math-genius-kids-summer",
        images: { unoptimized: true },
      }
    : {
        output: "standalone" as const,
      }),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
