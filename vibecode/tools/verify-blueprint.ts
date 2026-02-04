#!/usr/bin/env npx ts-node

/**
 * Vibecode Blueprint Verification Tool
 *
 * Verifies all URLs in a Blueprint before handoff to Builder.
 * Usage: npx ts-node verify-blueprint.ts <blueprint.json>
 *
 * Or pipe JSON directly:
 * cat blueprint.json | npx ts-node verify-blueprint.ts
 */

interface ImageAsset {
  id: string;
  url: string;
  fallback?: string;
  verified?: boolean;
}

interface Blueprint {
  project?: {
    name: string;
    type: string;
  };
  assets?: {
    images?: ImageAsset[];
  };
  [key: string]: unknown;
}

interface VerificationResult {
  url: string;
  status: number | "error";
  ok: boolean;
  error?: string;
  responseTime?: number;
}

const TIMEOUT_MS = 10000;
const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

async function verifyUrl(url: string): Promise<VerificationResult> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Vibecode-Blueprint-Verifier/1.0",
      },
    });

    clearTimeout(timeout);

    return {
      url,
      status: response.status,
      ok: response.ok,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      url,
      status: "error",
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: Date.now() - start,
    };
  }
}

function extractUrls(blueprint: Blueprint): string[] {
  const urls: string[] = [];

  // Extract from assets.images
  if (blueprint.assets?.images) {
    for (const img of blueprint.assets.images) {
      if (img.url) urls.push(img.url);
      if (img.fallback) urls.push(img.fallback);
    }
  }

  // Deep search for any URL patterns in the entire blueprint
  const jsonStr = JSON.stringify(blueprint);
  const urlRegex = /https?:\/\/[^\s"']+/g;
  const matches = jsonStr.match(urlRegex) || [];

  for (const match of matches) {
    // Clean up trailing punctuation
    const cleanUrl = match.replace(/[",}\]]+$/, "");
    if (!urls.includes(cleanUrl)) {
      urls.push(cleanUrl);
    }
  }

  return [...new Set(urls)]; // Deduplicate
}

async function verifyBlueprint(blueprint: Blueprint): Promise<void> {
  console.log(`\n${COLORS.cyan}╔════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.cyan}║   VIBECODE BLUEPRINT VERIFICATION      ║${COLORS.reset}`);
  console.log(`${COLORS.cyan}╚════════════════════════════════════════╝${COLORS.reset}\n`);

  if (blueprint.project?.name) {
    console.log(`Project: ${COLORS.cyan}${blueprint.project.name}${COLORS.reset}`);
    console.log(`Type: ${blueprint.project.type || "unknown"}\n`);
  }

  const urls = extractUrls(blueprint);

  if (urls.length === 0) {
    console.log(`${COLORS.yellow}⚠ No URLs found in Blueprint${COLORS.reset}`);
    return;
  }

  console.log(`Found ${urls.length} URL(s) to verify:\n`);

  const results: VerificationResult[] = [];

  for (const url of urls) {
    process.stdout.write(`  Checking: ${COLORS.dim}${url.substring(0, 60)}...${COLORS.reset} `);
    const result = await verifyUrl(url);
    results.push(result);

    if (result.ok) {
      console.log(`${COLORS.green}✓ ${result.status}${COLORS.reset} ${COLORS.dim}(${result.responseTime}ms)${COLORS.reset}`);
    } else {
      console.log(`${COLORS.red}✗ ${result.status}${COLORS.reset} ${result.error || ""}`);
    }
  }

  // Summary
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log(`\n${"─".repeat(50)}`);
  console.log(`\nResults: ${COLORS.green}${passed} passed${COLORS.reset}, ${failed > 0 ? COLORS.red : ""}${failed} failed${COLORS.reset}`);

  if (failed > 0) {
    console.log(`\n${COLORS.red}⚠ VERIFICATION FAILED${COLORS.reset}`);
    console.log(`\nFailed URLs:`);
    for (const r of results.filter((r) => !r.ok)) {
      console.log(`  ${COLORS.red}✗${COLORS.reset} ${r.url}`);
      if (r.error) console.log(`    ${COLORS.dim}${r.error}${COLORS.reset}`);
    }
    console.log(`\n${COLORS.yellow}Action: Replace failed URLs before handoff to Builder${COLORS.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${COLORS.green}✓ ALL URLS VERIFIED - Blueprint ready for Builder${COLORS.reset}\n`);
    process.exit(0);
  }
}

// Main
async function main() {
  let input = "";

  // Check for file argument
  if (process.argv[2]) {
    const fs = await import("fs");
    try {
      input = fs.readFileSync(process.argv[2], "utf-8");
    } catch (e) {
      console.error(`Error reading file: ${process.argv[2]}`);
      process.exit(1);
    }
  } else {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    input = Buffer.concat(chunks).toString("utf-8");
  }

  try {
    const blueprint = JSON.parse(input) as Blueprint;
    await verifyBlueprint(blueprint);
  } catch (e) {
    console.error("Error parsing Blueprint JSON:", e);
    process.exit(1);
  }
}

main();
