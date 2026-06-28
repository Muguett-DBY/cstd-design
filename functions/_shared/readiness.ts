export type ServiceReadinessStatus = "ready" | "attention";
export type ServiceReadinessCheckId = "database" | "media" | "generation" | "security";

export interface ServiceReadinessCheck {
  id: ServiceReadinessCheckId;
  label: string;
  status: ServiceReadinessStatus;
  detail: string;
}

export interface ServiceReadinessSnapshot {
  status: ServiceReadinessStatus;
  checkedAt: string;
  checks: ServiceReadinessCheck[];
}

export function buildServiceReadiness(input: {
  databaseReachable: boolean;
  mediaStorageReachable: boolean;
  generationConfigured: boolean;
  securityConfigured: boolean;
  checkedAt: string;
}): ServiceReadinessSnapshot {
  const checks: ServiceReadinessCheck[] = [
    {
      id: "database",
      label: "数据服务",
      status: input.databaseReachable ? "ready" : "attention",
      detail: input.databaseReachable ? "数据服务可访问。" : "数据服务暂不可用，请稍后重新检查。",
    },
    {
      id: "media",
      label: "素材存储",
      status: input.mediaStorageReachable ? "ready" : "attention",
      detail: input.mediaStorageReachable ? "素材存储已连接。" : "素材存储暂不可用，上传和生成结果可能无法保存。",
    },
    {
      id: "generation",
      label: "生成服务",
      status: input.generationConfigured ? "ready" : "attention",
      detail: input.generationConfigured
        ? "生成密钥已配置，实际可用性会在首次请求时确认。"
        : "生成服务尚未配置，咨询、图片和视频创作暂不可用。",
    },
    {
      id: "security",
      label: "安全配置",
      status: input.securityConfigured ? "ready" : "attention",
      detail: input.securityConfigured ? "登录与签名配置完整。" : "安全配置不完整，请检查后台环境变量。",
    },
  ];
  return {
    status: checks.every((check) => check.status === "ready") ? "ready" : "attention",
    checkedAt: input.checkedAt,
    checks,
  };
}
