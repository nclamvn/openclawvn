#!/usr/bin/env npx ts-node

/**
 * Vibecode Blueprint Schema Validator
 *
 * Validates Blueprint JSON against the official schema.
 * Usage: npx ts-node validate-blueprint.ts <blueprint.json>
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as fs from "fs";
import * as path from "path";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

interface ValidationError {
  path: string;
  message: string;
  keyword: string;
}

function validateBlueprint(blueprintPath: string): void {
  console.log(`\n${COLORS.cyan}╔════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.cyan}║   VIBECODE BLUEPRINT VALIDATION        ║${COLORS.reset}`);
  console.log(`${COLORS.cyan}╚════════════════════════════════════════╝${COLORS.reset}\n`);

  // Load schema
  const schemaPath = path.join(__dirname, "../schemas/blueprint.schema.json");
  let schema: object;

  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  } catch (e) {
    console.error(`${COLORS.red}Error loading schema:${COLORS.reset}`, e);
    process.exit(1);
  }

  // Load blueprint
  let blueprint: object;
  try {
    blueprint = JSON.parse(fs.readFileSync(blueprintPath, "utf-8"));
  } catch (e) {
    console.error(`${COLORS.red}Error loading blueprint:${COLORS.reset}`, e);
    process.exit(1);
  }

  // Validate
  const ajv = new Ajv({ allErrors: true, verbose: true });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(blueprint);

  if (valid) {
    console.log(`${COLORS.green}✓ Blueprint is VALID${COLORS.reset}\n`);

    // Show summary
    const bp = blueprint as Record<string, unknown>;
    const project = bp.project as Record<string, string> | undefined;
    const structure = bp.structure as Record<string, unknown[]> | undefined;
    const assets = bp.assets as Record<string, unknown[]> | undefined;

    if (project) {
      console.log(`  Project: ${COLORS.cyan}${project.name}${COLORS.reset}`);
      console.log(`  Type: ${project.type}`);
    }
    if (structure?.pages) {
      console.log(`  Pages: ${structure.pages.length}`);
    }
    if (structure?.components) {
      console.log(`  Components: ${structure.components.length}`);
    }
    if (assets?.images) {
      console.log(`  Images: ${assets.images.length}`);
    }

    console.log(`\n${COLORS.green}Blueprint ready for URL verification${COLORS.reset}`);
    console.log(`${COLORS.dim}Run: npx ts-node verify-blueprint.ts ${blueprintPath}${COLORS.reset}\n`);

    process.exit(0);
  } else {
    console.log(`${COLORS.red}✗ Blueprint is INVALID${COLORS.reset}\n`);

    const errors: ValidationError[] = (validate.errors || []).map((err) => ({
      path: err.instancePath || "/",
      message: err.message || "Unknown error",
      keyword: err.keyword,
    }));

    console.log(`Found ${errors.length} error(s):\n`);

    for (const err of errors) {
      console.log(`  ${COLORS.red}✗${COLORS.reset} ${COLORS.yellow}${err.path}${COLORS.reset}`);
      console.log(`    ${err.message} ${COLORS.dim}(${err.keyword})${COLORS.reset}`);
    }

    console.log(`\n${COLORS.yellow}Action: Fix errors before proceeding${COLORS.reset}\n`);
    process.exit(1);
  }
}

// Main
const blueprintPath = process.argv[2];

if (!blueprintPath) {
  console.log(`
Usage: npx ts-node validate-blueprint.ts <blueprint.json>

Validates a Vibecode Blueprint against the official schema.
`);
  process.exit(1);
}

validateBlueprint(blueprintPath);
