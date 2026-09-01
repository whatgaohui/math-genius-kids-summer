// GitHub Pages 静态构建：
// 1. 临时移出 src/app/api（/api/tts 是 force-dynamic + 服务端 SDK，静态导出不支持；
//    前端对这些接口已有降级：TTS 走浏览器 Web Speech，题库管理器静默失败）
// 2. 以 STATIC_EXPORT=1 执行 next build（输出到 out/）
// 3. 无论成败都还原 src/app/api，保证仓库不被改动
import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const apiDir = "src/app/api";
// 备份目录必须放在 src/app 之外，否则会被 App Router 当成路由继续扫描
const backupDir = ".api-static-backup";

const hadApi = existsSync(apiDir);
if (hadApi) renameSync(apiDir, backupDir);
console.log("[build-static] src/app/api 已临时移出");

try {
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, STATIC_EXPORT: "1" },
  });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
} finally {
  if (hadApi) renameSync(backupDir, apiDir);
  console.log("[build-static] src/app/api 已还原");
}
