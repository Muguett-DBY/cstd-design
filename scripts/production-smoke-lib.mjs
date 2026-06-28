export const REQUIRED_PAGE_SECRETS = [
  "APP_PASSWORD_HASH",
  "SESSION_SECRET",
  "LOGIN_HASH_SECRET",
  "ASSET_CAPABILITY_SECRET",
  "UPSTREAM_API_KEY",
];

export function findMissingPageSecrets(output) {
  return REQUIRED_PAGE_SECRETS.filter((name) => !new RegExp(`\\b${name}\\s*:`).test(output));
}

export function selectDeploymentForCommit(deployments, commitSha) {
  const commit = String(commitSha || "").trim().toLowerCase();
  const deployment = deployments.find((item) => {
    const source = String(item.Source || "").trim().toLowerCase();
    return String(item.Environment || "").toLowerCase() === "production"
      && source.length > 0
      && (commit.startsWith(source) || source.startsWith(commit));
  });
  if (!deployment?.Deployment) {
    throw new Error(`Production deployment not found for commit ${commitSha}.`);
  }
  return deployment;
}

async function fetchWithRetry(fetcher, url, init, expectedStatus) {
  let response;
  let lastError;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      response = await fetcher(url, init);
      if (response.status === expectedStatus) return response;
    } catch (error) {
      lastError = error;
    }
    if (attempt < 10) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  if (response) return response;
  throw lastError || new Error(`Request failed: ${url}`);
}

async function expectStatus(fetcher, baseUrl, path, status, init = {}) {
  const response = await fetchWithRetry(fetcher, `${baseUrl}${path}`, init, status);
  const body = await response.text();
  if (response.status !== status) {
    throw new Error(`${init.method || "GET"} ${path} expected HTTP ${status}, received ${response.status}: ${body.slice(0, 300)}`);
  }
  return body;
}

export async function runProductionSmoke(baseUrl, fetcher = fetch) {
  const normalizedBaseUrl = String(baseUrl || "").replace(/\/$/, "");
  if (!/^https:\/\//.test(normalizedBaseUrl)) {
    throw new Error("Production smoke requires an HTTPS base URL.");
  }

  const shell = await expectStatus(fetcher, normalizedBaseUrl, "/", 200);
  if (!/<title>工作台 - 私人中文创作工作台<\/title>/.test(shell)) {
    throw new Error("Production app shell title did not match the expected product title.");
  }

  const sessionText = await expectStatus(fetcher, normalizedBaseUrl, "/api/session", 200);
  const session = JSON.parse(sessionText);
  if (session.authenticated !== false || session.expiresAt !== null) {
    throw new Error(`Anonymous session contract changed: ${sessionText.slice(0, 300)}`);
  }

  await expectStatus(fetcher, normalizedBaseUrl, "/api/conversations", 401);
  await expectStatus(fetcher, normalizedBaseUrl, "/api/session/test", 404, { method: "POST" });

  return {
    ok: true,
    baseUrl: normalizedBaseUrl,
    anonymousSessionVerified: true,
    authBoundaryVerified: true,
    e2eBypassDisabled: true,
  };
}
