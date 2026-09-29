import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const uiRoot = resolve(docsRoot, "..");
export const cmdkRoot = resolve(uiRoot, "..", "cmdk");

export interface StoryInfo {
  /** Absolute path of the story file. */
  file: string;
  /** Root of the package the story belongs to. */
  packageRoot: string;
  /** Package name, e.g. `@teb-ooo/ui`. */
  packageName: string;
  title: string;
  group: string;
  description: string;
  component?: string;
  source?: string;
  /** Named exports, in file order. */
  variants: string[];
  slug: string;
}

export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

export interface PropsDoc {
  component: string;
  package: string;
  /** Base types the props interface extends, as written. */
  extends: string[];
  props: PropDoc[];
}

/** Directories whose `src/**\/*.stories.tsx` the gallery shows. The cmdk repo is optional. */
export function storyRoots(): string[] {
  return [uiRoot, cmdkRoot].filter((r) => existsSync(join(r, "src")));
}

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".stories.tsx")) out.push(p);
  }
}

export function findStoryFiles(roots: string[] = storyRoots()): string[] {
  const out: string[] = [];
  for (const r of roots) walk(join(r, "src"), out);
  return out.sort();
}

/** `/<group>/<file basename without .stories.tsx>`, lower-case, without the leading slash. */
export function slugFor(file: string, group: string): string {
  return `${group.toLowerCase()}/${basename(file).replace(/\.stories\.tsx$/, "")}`;
}

function packageName(root: string): string {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { name: string };
  return pkg.name;
}

function stringProp(obj: ts.ObjectLiteralExpression, key: string): string | undefined {
  for (const p of obj.properties) {
    if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === key) {
      const init = ts.isSatisfiesExpression(p.initializer) ? p.initializer.expression : p.initializer;
      if (ts.isStringLiteralLike(init)) return init.text;
    }
  }
  return undefined;
}

function defaultObject(sf: ts.SourceFile): ts.ObjectLiteralExpression | undefined {
  for (const st of sf.statements) {
    if (ts.isExportAssignment(st)) {
      let e: ts.Expression = st.expression;
      while (ts.isSatisfiesExpression(e) || ts.isAsExpression(e) || ts.isParenthesizedExpression(e)) e = e.expression;
      if (ts.isObjectLiteralExpression(e)) return e;
    }
  }
  return undefined;
}

function hasExportModifier(st: ts.Statement): boolean {
  return ts.canHaveModifiers(st) && (ts.getModifiers(st) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

/** Reads a story file's default export and named exports through the TypeScript AST (no execution). */
export function scanStory(file: string): StoryInfo {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  const obj = defaultObject(sf);
  if (!obj) throw new Error(`${file}: no default export object`);
  const variants: string[] = [];
  for (const st of sf.statements) {
    if (ts.isVariableStatement(st) && hasExportModifier(st)) {
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) variants.push(d.name.text);
    } else if (ts.isFunctionDeclaration(st) && hasExportModifier(st) && st.name) {
      variants.push(st.name.text);
    }
  }
  const group = stringProp(obj, "group") ?? "";
  let root = dirname(file);
  while (!existsSync(join(root, "package.json"))) root = dirname(root);
  const info: StoryInfo = {
    file,
    packageRoot: root,
    packageName: packageName(root),
    title: stringProp(obj, "title") ?? "",
    group,
    description: stringProp(obj, "description") ?? "",
    variants,
    slug: slugFor(file, group),
  };
  const component = stringProp(obj, "component");
  const source = stringProp(obj, "source");
  if (component !== undefined) info.component = component;
  if (source !== undefined) info.source = source;
  return info;
}

export function scanAll(files: string[] = findStoryFiles()): StoryInfo[] {
  return files.map(scanStory);
}

/** Builds the props tables from the exported `<Component>Props` interfaces named by the stories. */
export function buildProps(stories: StoryInfo[]): Record<string, PropsDoc> {
  const out: Record<string, PropsDoc> = {};
  const byRoot = new Map<string, StoryInfo[]>();
  for (const s of stories) {
    if (!s.component || !s.source) continue;
    byRoot.set(s.packageRoot, [...(byRoot.get(s.packageRoot) ?? []), s]);
  }
  for (const [root, list] of byRoot) {
    const files = list.map((s) => resolve(root, s.source ?? ""));
    const program = ts.createProgram(files, {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      allowImportingTsExtensions: true,
      types: [],
    });
    const checker = program.getTypeChecker();
    for (const s of list) {
      const sf = program.getSourceFile(resolve(root, s.source ?? ""));
      if (!sf || !s.component) throw new Error(`${s.file}: cannot read source ${s.source}`);
      const decl = sf.statements.find(
        (st): st is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(st) && st.name.text === `${s.component}Props`,
      );
      if (!decl) throw new Error(`${s.source}: no interface ${s.component}Props`);
      const type = checker.getTypeAtLocation(decl.name);
      const props: PropDoc[] = [];
      for (const sym of checker.getPropertiesOfType(type)) {
        if (!sym.declarations?.some((d) => d.parent === decl)) continue;
        const t = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(sym, decl));
        const declared = sym.declarations?.find(ts.isPropertySignature)?.type?.getText(sf);
        const literals = t.isUnion() && t.types.every((m) => m.isStringLiteral()) ? t.types.map((m) => checker.typeToString(m)) : null;
        const prop: PropDoc = {
          name: sym.getName(),
          type: literals ? literals.join(" | ") : (declared ?? checker.typeToString(t, decl, ts.TypeFormatFlags.NoTruncation)).replace(/\s+/g, " "),
          required: !(sym.flags & ts.SymbolFlags.Optional),
          description: ts.displayPartsToString(sym.getDocumentationComment(checker)).trim(),
        };
        const def = sym.getJsDocTags(checker).find((tag) => tag.name === "default");
        if (def) prop.default = ts.displayPartsToString(def.text).trim();
        props.push(prop);
      }
      out[s.component] = {
        component: s.component,
        package: s.packageName,
        extends: (decl.heritageClauses ?? []).flatMap((h) => h.types.map((t) => t.getText(sf))),
        props,
      };
    }
  }
  return out;
}

export function relativeToPackage(s: StoryInfo): string {
  return relative(s.packageRoot, s.file);
}
