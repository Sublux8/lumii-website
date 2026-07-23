import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverEntry = resolve(root, "dist/server/entry.mjs");
const sitesEntry = resolve(root, "dist/server/index.js");
const hostingConfig = resolve(root, ".openai/hosting.json");
const packagedHostingConfig = resolve(root, "dist/.openai/hosting.json");

await mkdir(dirname(packagedHostingConfig), { recursive: true });
await copyFile(serverEntry, sitesEntry);
await copyFile(hostingConfig, packagedHostingConfig);
