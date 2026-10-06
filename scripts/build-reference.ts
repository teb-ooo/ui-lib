import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildReference } from "./reference.ts";

writeFileSync(join(import.meta.dirname, "..", "docs", "reference.md"), buildReference());
