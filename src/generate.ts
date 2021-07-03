#!/usr/bin/env node

import { generate } from "@graphql-codegen/cli";
import { join as pathJoin, resolve as pathResolve } from "path";
import minimist from "minimist";

const { schema, output, operations } = minimist<{
  schema?: string;
  operations?: string;
  output?: string;
}>(process.argv.slice(2));

if (!schema) {
  console.error("Missing schema");
  process.exit(1);
}

if (!operations) {
  console.error("Missing operations path");
  process.exit(1);
}

async function applyCodegen() {
  await generate(
    {
      schema: schema,
      documents: operations,
      generates: {
        [pathResolve(output || "sonar.ts")]: {
          plugins: [
            "typescript",
            "typescript-operations",
            pathJoin(__dirname, "plugin.js"),
          ],
          config: {},
        },
      },
    },
    true
  );
}

async function main() {
  await applyCodegen();
}

main();
