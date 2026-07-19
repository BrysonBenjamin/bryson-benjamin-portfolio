import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { app } from "../app";

const outPath = resolve(import.meta.dir, "../../openapi.json");

const response = await app.request("/openapi.json");

if (!response.ok) {
  throw new Error(`Failed to generate OpenAPI document: ${response.status} ${response.statusText}`);
}

const spec = await response.json();

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(spec, null, 2)}\n`);

console.log(`Wrote OpenAPI document to ${outPath}`);
