// 为英语词汇预生成朗读音频（网页版听力兜底，不依赖系统 TTS 声音）
// 用法：npm run gen:tts-audio
// 依赖 msedge-tts（一次性内容生成工具，不进 package.json，CI 无需它）：
//   首次运行前先 npm i -D msedge-tts，生成完产物提交仓库即可移除
// 数据源：src/lib/question-bank/english/generators.ts 的词汇库（word 字段）
// 输出：public/audio/en/<slug>.mp3，已存在的跳过（幂等，可重复运行）
//
// 前端约定：src/lib/tts.ts 的 slugify 必须与本脚本一致。
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VOICE = "en-US-AnaNeural"; // 微软儿童音色，适合少儿英语
const SRC = "src/lib/question-bank/english/generators.ts";
const OUT_DIR = "public/audio/en";

let MsEdgeTTS, OUTPUT_FORMAT;
try {
  ({ MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts"));
} catch {
  console.error("[gen-tts] 缺少依赖 msedge-tts，请先运行：npm i -D msedge-tts");
  process.exit(1);
}

export function slugifyWord(word) {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const src = readFileSync(SRC, "utf-8");
  const words = [...new Set([...src.matchAll(/word:\s*'([^']+)'/g)].map((m) => m[1]))];
  console.log(`[gen-tts] 提取到 ${words.length} 个唯一词汇`);

  mkdirSync(OUT_DIR, { recursive: true });
  const todo = words.filter((w) => {
    const p = join(OUT_DIR, `${slugifyWord(w)}.mp3`);
    return !existsSync(p) || statSync(p).size < 512;
  });
  console.log(`[gen-tts] 待生成 ${todo.length} 个（已存在跳过）`);
  if (todo.length === 0) return;

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  let ok = 0;
  let fail = 0;
  const failed = [];

  for (const word of todo) {
    const slug = slugifyWord(word);
    const tmpDir = join("tmp-tts-gen", slug);
    try {
      mkdirSync(tmpDir, { recursive: true });
      const { audioFilePath } = await tts.toFile(tmpDir, word);
      // 校验产物非空再落位，避免半截文件被当成已完成
      const size = statSync(audioFilePath).size;
      if (size < 512) throw new Error(`audio too small: ${size}B`);
      writeFileSync(join(OUT_DIR, `${slug}.mp3`), readFileSync(audioFilePath));
      ok++;
    } catch (err) {
      fail++;
      failed.push(`${word}: ${err.message}`);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  console.log(`[gen-tts] 完成：成功 ${ok}，失败 ${fail}`);
  if (failed.length) {
    console.log("[gen-tts] 失败列表：\n" + failed.join("\n"));
    process.exitCode = 1;
  }
}

main();
