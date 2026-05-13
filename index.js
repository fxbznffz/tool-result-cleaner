/**
 * tool-result-cleaner OpenClaw plugin
 * Contract: agentToolResultMiddleware (runtime: pi)
 * OpenClaw 工具输出智能净化插件
 */

const VERSION = "1.1.0";

// 默认配置常量
const DEFAULT_MAX_LINES = 80;
const DEFAULT_KEYWORDS = ["error", "fail", "warning", "critical", "ERR", "FAIL"];

// 垃圾日志匹配正则表达式（支持 npm/yarn/pip/apt）
const GARBAGE_PATTERNS = /^\s*(npm notice|npm WARN|Tarball Details|File:|===|---|[0-9]+\.[0-9]+\.[0-9]+\.\d+|info:|progress:|notice:|debug:|yarn warning|yarn notice|Reading package lists|Building dependency tree)/gim;

function createToolResultCleanerMiddleware({
  maxLinesPerBlock = DEFAULT_MAX_LINES,
  importantKeywords = DEFAULT_KEYWORDS,
  debug = false,
} = {}) {
  return async (event) => {
    if (!event.result || !Array.isArray(event.result.content)) return event;

    const cleanedContent = [];
    let originalTotalLines = 0;
    let cleanedTotalLines = 0;

    for (const block of event.result.content) {
      if (block.type === "text") {
        let text = block.text;

        // 1. 增强垃圾日志过滤（支持 npm/yarn/pip/apt）
        text = text.replace(GARBAGE_PATTERNS, "");

        // 2. 增强空白行清理（清理纯空格、制表符空行）
        text = text.replace(/^\s*$/gm, "");
        text = text.replace(/\n+/g, "\n").trim();

        // 3. 按行拆分 + 清理
        let lines = text.split("\n").map(l => l.trimEnd()).filter(Boolean);
        originalTotalLines += lines.length;

        // 4. 增强去重（trim 后去重，解决带空格的重复刷屏）
        const seen = new Set();
        lines = lines.filter(line => {
          const key = line.trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // 5. 关键字保留（大小写不敏感，更稳健）
        const keywordLines = lines.filter(line =>
          importantKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))
        );

        // 6. 最终行数限制
        const finalLines = keywordLines.length > 0
          ? keywordLines.slice(0, maxLinesPerBlock)
          : lines.slice(0, maxLinesPerBlock);

        cleanedTotalLines += finalLines.length;
        const finalText = finalLines.join("\n");

        if (finalText) {
          cleanedContent.push({ type: "text", text: finalText });
        }
      } else if (block.type === "image") {
        cleanedContent.push(block);
      } else {
        cleanedContent.push(block);
      }
    }

    // Debug 输出压缩效果
    if (debug) {
      const reduce = originalTotalLines - cleanedTotalLines;
      const percent = originalTotalLines > 0 ? ((reduce / originalTotalLines) * 100).toFixed(1) : 0;
      console.log(`[tool-result-cleaner] 清理完成：原始 ${originalTotalLines} 行 → 清理后 ${cleanedTotalLines} 行 → 节省 ${percent}%`);
    }

    return { ...event, result: { ...event.result, content: cleanedContent } };
  };
}

export function register(api) {
  api.registerAgentToolResultMiddleware(
    createToolResultCleanerMiddleware({
      debug: false, // 想开启日志显示 → 改成 true
    }),
    { runtimes: ["pi"] }
  );
}
