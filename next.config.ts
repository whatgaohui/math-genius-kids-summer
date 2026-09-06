import type { NextConfig } from "next";

// STATIC_EXPORT=1 时输出静态站（npm run build:static / CI 部署用），
// 其中 APK_BUILD=1 是安卓 APK 专用变体：同样是静态导出，但应用在
// Capacitor WebView 里跑在 https://localhost/ 根路径，不能带 GitHub Pages
// 的 basePath 子路径，否则所有资源引用 404 → 白屏。
// 其余情况保持原有 standalone 输出（服务器流程不受影响）
const isStaticExport = process.env.STATIC_EXPORT === "1";
const useBasePath = isStaticExport && process.env.APK_BUILD !== "1";

const nextConfig: NextConfig = {
  ...(isStaticExport
      ? useBasePath
        ? {
            output: "export" as const,
            basePath: "/math-genius-kids-summer",
            images: { unoptimized: true },
            // 客户端代码（如 tts.ts 拼本地音频 URL）需要感知子路径
            env: { NEXT_PUBLIC_BASE_PATH: "/math-genius-kids-summer" },
          }
        : {
            output: "export" as const,
            images: { unoptimized: true },
            // APK 内为根路径部署，客户端 basePath 为空串
            env: { NEXT_PUBLIC_BASE_PATH: "" },
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
