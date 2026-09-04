# AGENTS.md — 知识小勇士 · 暑期数学突击训练营

给 8 岁升三年级孩子的学习应用（数学/语文/英语三科练习 + 宠物养成 + 金币闯关），Next.js 15 + React 19 + Tailwind 4 + shadcn/ui + zustand。一份代码三种发布形态：**GitHub Pages 静态站（主用）、standalone 服务器、安卓 APK（Capacitor）**。

## 常用命令

```bash
bun install            # 依赖管理用 bun（仓库锁 bun.lock，package-lock.json 已 gitignore）
bun run dev            # 开发，端口 3000，日志 tee 到 dev.log
npm run lint           # eslint
npm run build          # standalone 构建（服务器 / APK 流程用）
npm run build:static   # GitHub Pages 静态导出（CI 也用它）
npm run gen:tts-audio  # 预生成朗读 mp3（先 npm i -D msedge-tts，该依赖不进 package.json）
```

推送到 `main` 自动触发 `.github/workflows/deploy-pages.yml` 发布到 GitHub Pages。

## 架构

- **单页客户端应用**：`src/app/page.tsx` 是唯一路由（`'use client'`），所有页面组件 `dynamic(..., { ssr: false })` 懒加载，"路由"靠 zustand `src/lib/game-store.ts` 的 page 状态切换。不要新增 app 路由页面。
- **状态**：zustand + persist（localStorage）。各领域 store 在 `src/lib/*-store.ts`（game/pet/onboarding/leaderboard/summer-camp）。学习进度全部存浏览器本地，无账号体系。
- **题库生成**：`src/lib/question-bank/{math,chinese,english}/`，每科 generators.ts（出题数据源）+ index.ts + template.ts。词汇/拼音数据改动会影响 TTS 音频覆盖（见下）。
- **API 路由只有两个**：`src/app/api/tts`（服务端 TTS，force-dynamic，z-ai-web-dev-sdk）和 `src/app/api/question-bank`（题库管理）。它们**只存在于 standalone 构建**；静态导出时被移出（见 build:static 机制）。
- **组件**：`src/components/math|chinese|english|question-bank|shared|ui`。`ui/` 是 shadcn 组件，改动样式优先复用它。
- **prisma/ + db/custom.db 是脚手架遗留**（User/Post 模板模型），业务实际未使用，勿在其上建模。

## TTS 朗读链路（改声音相关必读）

`src/lib/tts.ts` 的回退顺序：**安卓原生桥 `window.AndroidTTS` → 预生成本地 mp3（public/audio/en|zh，已提交仓库）→ 服务端 /api/tts → 浏览器 Web Speech**。历史坑（都修过，别回退）：

- 语文听写（ChinesePlay）实际朗读的是**拼音串**（chinese-utils.ts 的 pinyin 字段），不是题库 prompt 句——mp3 是按拼音串生成的（commit e4f6412）。
- `scripts/generate-tts-audio.mjs` 的 `slugifyWord`/`hashText` 必须与 `tts.ts` 中同名函数**完全一致**，否则前端找不到 mp3。改词汇/拼音数据后要重跑 `gen:tts-audio` 补新音频（脚本幂等，只补缺）。
- 本地音频 `playbackRate` 必须在 `canplaythrough` 之后设置，否则被 Chromium 重置回 1.0。
- APK 内 WebView 不支持 Web Speech，必须走原生桥；原生桥判存在只看对象存在（初始化要 1-2 秒，`isAvailable()` 期间为 false，等待逻辑勿删）。

## 构建陷阱

- **build:static 会临时把 `src/app/api` 移到 `.api-static-backup/` 再构建，结束自动还原**。若构建中断留下备份目录，需手动还原，否则 standalone 路由丢失。
- 静态导出 basePath 为 `/math-genius-kids-summer`，客户端拼音频 URL 用 `NEXT_PUBLIC_BASE_PATH`（见 tts.ts），新增 public 资源引用时同样要带。
- `next.config.ts` 设了 `typescript.ignoreBuildErrors: true`——**构建不查类型**，改完 ts 代码要自己跑 `npx tsc --noEmit` 验证。
- 静态站运行时不能依赖任何 `/api/*`（前端已有降级，别在客户端代码里把 API 设为唯一路径）。
- APK 构建：Capacitor `webDir: "out"`（即静态导出产物），安卓工程在 `android/`，产物 `public/app-debug.apk`。
