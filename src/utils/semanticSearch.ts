const SYNONYM_MAP: Record<string, string[]> = {
  "代码": ["code", "编程", "程序", "开发", "coding"],
  "bug": ["错误", "问题", "issue", "故障", "defect"],
  "设计": ["design", "界面", "ui", "布局", "layout"],
  "图片": ["image", "图", "照片", "photo", "画"],
  "视频": ["video", "影片", "动画"],
  "文档": ["document", "doc", "文件", "documentation"],
  "测试": ["test", "testing", "验证", "check"],
  "部署": ["deploy", "发布", "上线", "release"],
  "性能": ["performance", "速度", "快", "慢", "perf"],
  "安全": ["security", "安全", "权限", "auth"],
  "配置": ["config", "设置", "configuration", "setup"],
  "数据库": ["database", "db", "数据", "data"],
  "API": ["api", "接口", "endpoint", "rest"],
  "前端": ["frontend", "front-end", "ui", "客户端"],
  "后端": ["backend", "back-end", "server", "服务端"],
  "帮助": ["help", "怎么", "如何", "how", "guide"],
  "错误": ["error", "失败", "异常", "exception"],
  "修复": ["fix", "修复", "修补", "修复"],
  "优化": ["optimize", "优化", "改进", "improve"],
  "建议": ["suggestion", "推荐", "建议", "recommend"],
};

function getExpandedKeywords(query: string): string[] {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const expanded = new Set<string>([query.toLowerCase()]);
  
  for (const kw of keywords) {
    expanded.add(kw);
    for (const [chinese, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (chinese.includes(kw) || kw.includes(chinese)) {
        for (const s of synonyms) expanded.add(s);
      }
      for (const s of synonyms) {
        if (s.includes(kw) || kw.includes(s)) {
          expanded.add(chinese);
          break;
        }
      }
    }
  }
  
  return Array.from(expanded);
}

function fuzzyMatch(text: string, keyword: string): boolean {
  const t = text.toLowerCase();
  const k = keyword.toLowerCase();
  if (t.includes(k)) return true;
  
  if (k.length >= 4) {
    let chars = 0;
    for (let i = 0; i < t.length && chars < k.length; i++) {
      if (t[i] === k[chars]) chars++;
    }
    if (chars >= k.length - 1) return true;
  }
  
  const tWords = t.split(/\s+/);
  const kWords = k.split(/\s+/);
  let matches = 0;
  for (const kw of kWords) {
    for (const tw of tWords) {
      if (tw.includes(kw) || kw.includes(tw)) {
        matches++;
        break;
      }
    }
  }
  return matches > 0;
}

export function expandSearchQuery(query: string): string[] {
  return getExpandedKeywords(query);
}

export function semanticMatch(text: string, query: string): boolean {
  const keywords = getExpandedKeywords(query);
  return keywords.some((kw) => fuzzyMatch(text, kw));
}
