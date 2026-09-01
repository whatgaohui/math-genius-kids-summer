# 知识小勇士 · 暑期数学突击训练营

> 60 天加减法突击，针对 8 岁升三年级孩子。数学 / 语文 / 英语三科练习 + 宠物养成 + 金币奖励 + 闯关模式。

## 🌐 在线使用

**[https://whatgaohui.github.io/math-genius-kids-summer/](https://whatgaohui.github.io/math-genius-kids-summer/)**

推荐用手机浏览器打开（或电脑浏览器按 F12 切换手机视图），学习进度保存在浏览器本地。

推送到 `main` 分支会通过 GitHub Actions 自动构建并发布（静态导出模式，构建脚本 `npm run build:static`）。

## 本地开发

```bash
bun install        # 或 npm install
bun run dev        # 或 npm run dev，访问 http://localhost:3000
```

- `npm run build`：原 standalone 构建（服务器 / APK 流程使用）
- `npm run build:static`：GitHub Pages 静态导出（临时移出 `src/app/api`，构建后自动还原）

## 说明

网页版语音朗读使用浏览器内置 TTS（Web Speech API）；APK 内使用安卓原生 TTS。
