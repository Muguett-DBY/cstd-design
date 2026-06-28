import { findMissingPageSecrets } from "./production-smoke-lib.mjs";
import { runWrangler } from "./wrangler-command.mjs";

const output = runWrangler(["pages", "secret", "list", "--project-name", "cstd-design"]);
const missing = findMissingPageSecrets(output);

if (missing.length > 0) {
  console.error(`Missing required Cloudflare Pages secrets: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Required Cloudflare Pages secret names are configured.");
