import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path of the package root. */
export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
