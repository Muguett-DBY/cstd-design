import type { ServiceReadinessSnapshot } from "../api";

const SECRET_ASSIGNMENT_PATTERN = /\b[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|PRIVATE|CREDENTIAL)[A-Z0-9_]*\s*=\s*[^\s,;，。]+/gi;
const SECRET_VALUE_PATTERN = /\b(?:sk|pk|tok|key|secret)[-_][A-Za-z0-9_-]{8,}\b/gi;

function sanitizeDiagnosticDetail(value: string) {
  return value
    .replace(SECRET_ASSIGNMENT_PATTERN, "[敏感配置已隐藏]")
    .replace(SECRET_VALUE_PATTERN, "[敏感值已隐藏]");
}

export function formatServiceReadinessDiagnostics(snapshot: ServiceReadinessSnapshot) {
  return [
    "cstd-design 服务诊断摘要",
    `整体状态: ${snapshot.status}`,
    `检查时间: ${snapshot.checkedAt}`,
    "说明: 该摘要只包含状态与清洗后的检查描述，不包含密钥值。",
    "",
    ...snapshot.checks.map((check) => (
      `- ${check.label}: ${check.status} — ${sanitizeDiagnosticDetail(check.detail)}`
    )),
  ].join("\n");
}
