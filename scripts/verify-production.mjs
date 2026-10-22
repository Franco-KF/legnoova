/**
 * Production Readiness Verification Script
 * 
 * Run with: node scripts/verify-production.mjs
 * 
 * This script checks:
 * 1. Environment variables
 * 2. TypeScript compilation
 * 3. ESLint compliance
 * 4. Build success
 * 5. MT5 bridge files exist
 * 6. Security checks (no secrets in code)
 * 7. API route coverage
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
let passed = 0;
let failed = 0;
const warnings = [];
const errors = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    errors.push(`${name}: ${detail}`);
    console.log(`  ❌ ${name} ${detail ? `— ${detail}` : ""}`);
  }
}

function warn(name, detail = "") {
  warnings.push(`${name}: ${detail}`);
  console.log(`  ⚠️  ${name} ${detail ? `— ${detail}` : ""}`);
}

async function run() {
  console.log("\n🔍 Legnoova Production Readiness Verification\n");
  console.log("=" .repeat(60));

  // 1. Environment Variables
  console.log("\n📋 1. Environment Variables");
  const envExample = readFileSync(path.join(root, ".env.example"), "utf8");
  const envLocal = existsSync(path.join(root, ".env.local"))
    ? readFileSync(path.join(root, ".env.local"), "utf8")
    : "";

  const requiredVars = [
    "MONGODB_URI",
    "GEMINI_API_KEY",
    "AUTH_SECRET",
    "NEXTAUTH_URL",
    "CARD_ENCRYPTION_KEY",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD_HASH",
  ];

  for (const v of requiredVars) {
    const inExample = envExample.includes(v);
    const inLocal = envLocal.includes(`${v}=`) && !envLocal.includes(`${v}=placeholder`);
    check(`ENV ${v} documented`, inExample);
    check(`ENV ${v} configured (not placeholder)`, inLocal, inLocal ? "" : "set in .env.local");
  }

  // Check for placeholder values in .env.local
  if (envLocal.includes("placeholder")) {
    warn("ENV placeholders still present in .env.local", "replace before production");
  }

  // 2. TypeScript Compilation
  console.log("\n📦 2. TypeScript Compilation");
  try {
    execSync("npx tsc --noEmit", { cwd: root, stdio: "pipe" });
    check("TypeScript compiles cleanly", true);
  } catch (e) {
    check("TypeScript compiles cleanly", false, e.stdout?.toString().slice(0, 200));
  }

  // 3. ESLint
  console.log("\n🧹 3. ESLint Compliance");
  try {
    execSync("npx eslint src/ --quiet", { cwd: root, stdio: "pipe" });
    check("ESLint passes (no errors)", true);
  } catch (e) {
    check("ESLint passes (no errors)", false, e.stdout?.toString().slice(0, 200));
  }

  // 4. Next.js Build
  console.log("\n🏗️  4. Next.js Production Build");
  try {
    execSync("npx next build", { cwd: root, stdio: "pipe", timeout: 180000 });
    check("Next.js build succeeds", true);
  } catch (e) {
    check("Next.js build succeeds", false, e.stdout?.toString().slice(0, 200));
  }

  // 5. MT5 Bridge Files
  console.log("\n🔗 5. MT5 Bridge Files");
  const mt5Dir = path.join(root, "integrations", "mt5");
  const bridgePy = existsSync(path.join(mt5Dir, "bridge.py"));
  const eaMq5 = existsSync(path.join(mt5Dir, "LegnoovaBridgeEA.mq5"));
  const bridgeReadme = existsSync(path.join(mt5Dir, "README.md"));

  check("bridge.py exists", bridgePy);
  check("LegnoovaBridgeEA.mq5 exists", eaMq5);
  check("MT5 README exists", bridgeReadme);

  if (bridgePy) {
    const bridgeContent = readFileSync(path.join(mt5Dir, "bridge.py"), "utf8");
    check("bridge.py has retry logic", bridgeContent.includes("RETRY_BASE_DELAY"));
    check("bridge.py has offline queue", bridgeContent.includes("OFFLINE_QUEUE_DIR"));
    check("bridge.py has WebSocket support", bridgeContent.includes("WS_URL"));
    check("bridge.py has health endpoint", bridgeContent.includes("/health"));
  }

  if (eaMq5) {
    const eaContent = readFileSync(path.join(mt5Dir, "LegnoovaBridgeEA.mq5"), "utf8");
    check("EA has adaptive polling", eaContent.includes("g_consecutiveFailures"));
    check("EA has retry/backoff", eaContent.includes("timeoutMs"));
    check("EA does NOT use HistoryDealsTicket (bug)", !eaContent.includes("HistoryDealsTicket"));
    check("EA uses HistoryDealGetTicket", eaContent.includes("HistoryDealGetTicket"));
    check("EA has version 0.7+", eaContent.includes('version "0.7'));
  }

  // 6. Security Checks
  console.log("\n🔒 6. Security Checks");
  // Check no real secrets committed in source (env var references are OK)
  const srcFiles = ["src/lib/gemini.ts", "src/lib/auth/auth.ts", "src/config/site.ts"];
  let secretsFound = false;
  for (const f of srcFiles) {
    const fp = path.join(root, f);
    if (existsSync(fp)) {
      const content = readFileSync(fp, "utf8");
      // Look for actual secret patterns, not env var names
      if (content.match(/sk-[a-zA-Z0-9]{20,}/) || content.match(/AIza[a-zA-Z0-9_-]{35}/) || content.match(/AKIA[a-zA-Z0-9]{16}/)) {
        secretsFound = true;
        errors.push(`Potential secret in ${f}`);
      }
    }
  }
  check("No hardcoded API keys/secrets in source code", !secretsFound);

  // Check .env.local is in .gitignore
  const gitignore = existsSync(path.join(root, ".gitignore"))
    ? readFileSync(path.join(root, ".gitignore"), "utf8")
    : "";
  check(".env.local in .gitignore", gitignore.includes(".env*") || gitignore.includes(".env.local"));

  // 7. API Route Coverage
  console.log("\n🛣️  7. API Route Coverage");
  const apiRoutes = [
    "/api/automation/settings",
    "/api/automation/device",
    "/api/automation/diagnostics/device",
    "/api/automation/events/device",
    "/api/automation/activity",
    "/api/automation/stream",
    "/api/health",
    "/api/analyze",
    "/api/signals",
  ];

  for (const route of apiRoutes) {
    const routePath = path.join(root, "src", "app", "api", route.replace("/api", ""), "route.ts");
    check(`API route ${route} exists`, existsSync(routePath));
  }

  // 8. Models
  console.log("\n🗄️  8. Database Models");
  const models = ["User.ts", "Analysis.ts", "AutomationTradeEvent.ts", "EAcknowledgement.ts"];
  for (const m of models) {
    check(`Model ${m} exists`, existsSync(path.join(root, "src", "models", m)));
  }

  // 9. MT5 Connection Flow Documentation
  console.log("\n📚 9. MT5 Connection Documentation");
  const botPage = path.join(root, "src", "app", "(app)", "app", "(gated)", "bot", "page.tsx");
  check("MT5 setup guide page exists", existsSync(botPage));

  // 10. Summary
  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${warnings.length} warnings\n`);

  if (failed > 0) {
    console.log("❌ ERRORS (must fix before production):");
    for (const e of errors) {
      console.log(`   • ${e}`);
    }
    console.log("");
  }

  if (warnings.length > 0) {
    console.log("⚠️  WARNINGS (recommended):");
    for (const w of warnings) {
      console.log(`   • ${w}`);
    }
    console.log("");
  }

  if (failed === 0) {
    console.log("✅ Platform is PRODUCTION READY\n");
    process.exit(0);
  } else {
    console.log("❌ Platform is NOT production ready. Fix errors above.\n");
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Verification script failed:", e);
  process.exit(1);
});
