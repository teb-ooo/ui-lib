import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildProps, docsRoot, scanAll } from "./scan-lib.ts";

const props = buildProps(scanAll());
const dir = join(docsRoot, "src", "generated");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "props.json"), `${JSON.stringify(props, null, 2)}\n`);
console.log(`wrote src/generated/props.json (${Object.keys(props).length} components)`);
