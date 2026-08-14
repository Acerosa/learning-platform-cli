import { isAbsolute, relative, resolve, sep } from "node:path";

export function resolveInside(root: string, candidate: string): string {
  if (candidate.includes("\0")) {
    throw new Error(`LP_PATH_ESCAPE: path contains a null byte (${candidate})`);
  }
  const destRoot = resolve(root);
  const full = resolve(destRoot, candidate);
  const rel = relative(destRoot, full);
  if (rel === "") return full;
  if (isAbsolute(rel) || rel.startsWith(`..${sep}`) || rel === ".." || rel.startsWith("../")) {
    throw new Error(`LP_PATH_ESCAPE: ${candidate} is outside ${destRoot}`);
  }
  return full;
}
