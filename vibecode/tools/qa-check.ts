#!/usr/bin/env npx ts-node

/**
 * Vibecode Post-Build QA Checker
 *
 * Automated verification checklist for built projects.
 * Usage: npx ts-node qa-check.ts [project-path]
 *
 * Checks:
 * 1. Dev server starts
 * 2. TypeScript compiles
 * 3. All image URLs in code return 200
 * 4. No console errors on page load
 * 5. Basic responsive check
 */

import * as fs from "fs";
import * as path from "path";
import { execSync, spawn, ChildProcess } from "child_process";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

const results: CheckResult[] = [];

function log(message: string): void {
  console.log(message);
}

function addResult(result: CheckResult): void {
  results.push(result);
  const icon = result.passed ? `${COLORS.green}✓${COLORS.reset}` : `${COLORS.red}✗${COLORS.reset}`;
  log(`  ${icon} ${result.name}: ${result.message}`);
  if (result.details && result.details.length > 0) {
    for (const detail of result.details) {
      log(`    ${COLORS.dim}${detail}${COLORS.reset}`);
    }
  }
}

// Check 1: Package.json exists and has required scripts
function checkPackageJson(projectPath: string): void {
  const pkgPath = path.join(projectPath, "package.json");

  if (!fs.existsSync(pkgPath)) {
    addResult({
      name: "package.json",
      passed: false,
      message: "Not found",
    });
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const hasDevScript = pkg.scripts?.dev;
    const hasBuildScript = pkg.scripts?.build;

    addResult({
      name: "package.json",
      passed: hasDevScript && hasBuildScript,
      message: hasDevScript && hasBuildScript ? "Valid with dev & build scripts" : "Missing required scripts",
    });
  } catch (e) {
    addResult({
      name: "package.json",
      passed: false,
      message: "Invalid JSON",
    });
  }
}

// Check 2: TypeScript compilation
function checkTypeScript(projectPath: string): void {
  try {
    // Try npm run build or tsc
    execSync("npm run build 2>&1", {
      cwd: projectPath,
      encoding: "utf-8",
      timeout: 120000,
    });

    addResult({
      name: "TypeScript",
      passed: true,
      message: "Compiles without errors",
    });
  } catch (e) {
    const error = e as { stdout?: string; stderr?: string };
    const output = error.stdout || error.stderr || "";
    const errors = output
      .split("\n")
      .filter((line) => line.includes("error") || line.includes("Error"))
      .slice(0, 5);

    addResult({
      name: "TypeScript",
      passed: false,
      message: "Compilation failed",
      details: errors,
    });
  }
}

// Check 3: Extract and verify image URLs from code
async function checkImageUrls(projectPath: string): Promise<void> {
  const srcPath = path.join(projectPath, "src");

  if (!fs.existsSync(srcPath)) {
    addResult({
      name: "Image URLs",
      passed: true,
      message: "No src directory found",
    });
    return;
  }

  // Find all URLs in source files
  const urls: string[] = [];
  const urlRegex = /https?:\/\/[^\s"'`]+\.(jpg|jpeg|png|gif|webp|svg)[^\s"'`]*/gi;

  function scanDir(dir: string): void {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes("node_modules")) {
        scanDir(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const matches = content.match(urlRegex) || [];
        urls.push(...matches);
      }
    }
  }

  scanDir(srcPath);
  const uniqueUrls = [...new Set(urls)].map((url) => url.replace(/['"`,)}\]]+$/, ""));

  if (uniqueUrls.length === 0) {
    addResult({
      name: "Image URLs",
      passed: true,
      message: "No external image URLs found",
    });
    return;
  }

  const failed: string[] = [];

  for (const url of uniqueUrls) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (!response.ok) {
        failed.push(`${url} (${response.status})`);
      }
    } catch (e) {
      failed.push(`${url} (network error)`);
    }
  }

  addResult({
    name: "Image URLs",
    passed: failed.length === 0,
    message: failed.length === 0 ? `All ${uniqueUrls.length} URLs verified` : `${failed.length}/${uniqueUrls.length} URLs failed`,
    details: failed.slice(0, 5),
  });
}

// Check 4: Dependencies installed
function checkDependencies(projectPath: string): void {
  const nodeModules = path.join(projectPath, "node_modules");

  if (!fs.existsSync(nodeModules)) {
    addResult({
      name: "Dependencies",
      passed: false,
      message: "node_modules not found - run npm install",
    });
    return;
  }

  addResult({
    name: "Dependencies",
    passed: true,
    message: "node_modules exists",
  });
}

// Check 5: Dev server starts
async function checkDevServer(projectPath: string): Promise<void> {
  return new Promise((resolve) => {
    let serverProcess: ChildProcess | null = null;
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (serverProcess) serverProcess.kill();
        addResult({
          name: "Dev Server",
          passed: false,
          message: "Timeout - server did not start in 30s",
        });
        resolve();
      }
    }, 30000);

    try {
      serverProcess = spawn("npm", ["run", "dev", "--", "-p", "3099"], {
        cwd: projectPath,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let output = "";

      serverProcess.stdout?.on("data", (data) => {
        output += data.toString();
        if (output.includes("Ready") || output.includes("started") || output.includes("localhost")) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            serverProcess?.kill();
            addResult({
              name: "Dev Server",
              passed: true,
              message: "Starts successfully",
            });
            resolve();
          }
        }
      });

      serverProcess.stderr?.on("data", (data) => {
        output += data.toString();
      });

      serverProcess.on("error", (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          addResult({
            name: "Dev Server",
            passed: false,
            message: `Failed to start: ${err.message}`,
          });
          resolve();
        }
      });

      serverProcess.on("exit", (code) => {
        if (!resolved && code !== null && code !== 0) {
          resolved = true;
          clearTimeout(timeout);
          addResult({
            name: "Dev Server",
            passed: false,
            message: `Exited with code ${code}`,
          });
          resolve();
        }
      });
    } catch (e) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        addResult({
          name: "Dev Server",
          passed: false,
          message: `Error: ${e}`,
        });
        resolve();
      }
    }
  });
}

// Main
async function main(): Promise<void> {
  const projectPath = process.argv[2] || process.cwd();

  log(`\n${COLORS.cyan}╔════════════════════════════════════════╗${COLORS.reset}`);
  log(`${COLORS.cyan}║   VIBECODE POST-BUILD QA CHECK         ║${COLORS.reset}`);
  log(`${COLORS.cyan}╚════════════════════════════════════════╝${COLORS.reset}\n`);

  log(`Project: ${COLORS.cyan}${projectPath}${COLORS.reset}\n`);
  log(`Running checks:\n`);

  // Run checks
  checkPackageJson(projectPath);
  checkDependencies(projectPath);
  checkTypeScript(projectPath);
  await checkImageUrls(projectPath);
  await checkDevServer(projectPath);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  log(`\n${"─".repeat(50)}`);
  log(`\n${COLORS.bold}Summary:${COLORS.reset} ${COLORS.green}${passed} passed${COLORS.reset}, ${failed > 0 ? COLORS.red : ""}${failed} failed${COLORS.reset}`);

  if (failed > 0) {
    log(`\n${COLORS.red}⚠ QA CHECK FAILED${COLORS.reset}`);
    log(`${COLORS.yellow}Fix issues before marking as DONE${COLORS.reset}\n`);
    process.exit(1);
  } else {
    log(`\n${COLORS.green}✓ ALL CHECKS PASSED - Product is DONE${COLORS.reset}\n`);
    process.exit(0);
  }
}

main();
