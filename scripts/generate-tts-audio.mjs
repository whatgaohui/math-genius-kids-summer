// 为词汇/句子预生成朗读音频（网页版听力兜底，不依赖系统 TTS 声音）
// 用法：npm run gen:tts-audio
// 依赖 msedge-tts（一次性内容生成工具，不进 package.json，CI 无需它）：
//   首次运行前先 npm i -D msedge-tts，生成完产物提交仓库即可移除
//
// 数据源与输出：
//   英语：src/lib/question-bank/english/generators.ts 的 word 字段
//         → public/audio/en/<slug>.mp3（slug=小写词面）
//   语文：src/lib/question-bank/chinese/generators.ts 的 pinyin 字段，
//         按听写题 prompt 模板拼整句 → public/audio/zh/<hash>.mp3（hash=文本指纹）
//
// 前端约定：src/lib/tts.ts 的 slugifyWord / hashText 必须与本脚本完全一致。
// 幂等：已存在的文件跳过，可重复运行（只补新条目）。
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

let MsEdgeTTS, OUTPUT_FORMAT;
try {
  ({ MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts"));
} catch {
  console.error("[gen-tts] 缺少依赖 msedge-tts，请先运行：npm i -D msedge-tts");
  process.exit(1);
}

const EN_VOICE = "en-US-AnaNeural"; // 英语：微软儿童音色
const ZH_VOICE = "zh-CN-XiaoxiaoNeural"; // 语文：晓晓（自然亲切）
const EN_SRC = "src/lib/question-bank/english/generators.ts";
const ZH_SRC = "src/lib/question-bank/chinese/generators.ts";
// 必须与 chinese/generators.ts 听写题 prompt 模板逐字符一致
const ZH_PROMPT = (pinyin) => `请选出拼音 "${pinyin}" 对应的词语：`;

export function slugifyWord(word) {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function hashText(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

async function main() {
  const enSrc = readFileSync(EN_SRC, "utf-8");
  const enWords = [...new Set([...enSrc.matchAll(/word:\s*'([^']+)'/g)].map((m) => m[1]))];

  const zhSrc = readFileSync(ZH_SRC, "utf-8");
  const pinyins = [...new Set([...zhSrc.matchAll(/pinyin:\s*'([^']+)'/g)].map((m) => m[1]))];
  const zhTexts = [...new Set(pinyins.map(ZH_PROMPT))];

  console.log(`[gen-tts] 英语 ${enWords.length} 词，语文 ${zhTexts.length} 句`);

  const tasks = [
    { voice: EN_VOICE, dir: "public/audio/en", items: enWords.map((w) => ({ text: w, file: `${slugifyWord(w)}.mp3` })) },
    { voice: ZH_VOICE, dir: "public/audio/zh", items: zhTexts.map((t) => ({ text: t, file: `${hashText(t)}.mp3` })) },
  ];

  let totalOk = 0;
  let totalFail = 0;
  const failed = [];

  for (const group of tasks) {
    mkdirSync(group.dir, { recursive: true });
    const todo = group.items.filter((it) => {
      const p = join(group.dir, it.file);
      return !existsSync(p) || statSync(p).size < 512;
    });
    console.log(`[gen-tts] ${group.dir}：待生成 ${todo.length}（共 ${group.items.length}，已存在跳过）`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(group.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    for (const it of todo) {
      const tmpDir = join("tmp-tts-gen", group.dir.replaceAll("/", "-"), it.file);
      try {
        mkdirSync(tmpDir, { recursive: true });
        const { audioFilePath } = await tts.toFile(tmpDir, it.text);
        const size = statSync(audioFilePath).size;
        if (size < 512) throw new Error(`audio too small: ${size}B`);
        writeFileSync(join(group.dir, it.file), readFileSync(audioFilePath));
        totalOk++;
      } catch (err) {
        totalFail++;
        failed.push(`${it.text}: ${err.message}`);
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  }

  console.log(`[gen-tts] 完成：成功 ${totalOk}，失败 ${totalFail}`);
  if (failed.length) {
    console.log("[gen-tts] 失败列表：\n" + failed.join("\n"));
    process.exitCode = 1;
  }
}

main();
