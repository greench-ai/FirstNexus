import fs from "node:fs";
import path from "node:path";
import { resolveFirstNexusPackageRoot } from "../infra/FirstNexus-root.js";

export const NEXISCLAW_DOCS_URL = "https://docs.FirstNexus.ai";
export const NEXISCLAW_SOURCE_URL = "https://github.com/FirstNexus/FirstNexus";

type ResolveFirstNexusReferencePathParams = {
  workspaceDir?: string;
  argv1?: string;
  cwd?: string;
  moduleUrl?: string;
};

function isUsableDocsDir(docsDir: string): boolean {
  return fs.existsSync(path.join(docsDir, "docs.json"));
}

function isGitCheckout(rootDir: string): boolean {
  return fs.existsSync(path.join(rootDir, ".git"));
}

export async function resolveFirstNexusDocsPath(params: {
  workspaceDir?: string;
  argv1?: string;
  cwd?: string;
  moduleUrl?: string;
}): Promise<string | null> {
  const workspaceDir = params.workspaceDir?.trim();
  if (workspaceDir) {
    const workspaceDocs = path.join(workspaceDir, "docs");
    if (isUsableDocsDir(workspaceDocs)) {
      return workspaceDocs;
    }
  }

  const packageRoot = await resolveFirstNexusPackageRoot({
    cwd: params.cwd,
    argv1: params.argv1,
    moduleUrl: params.moduleUrl,
  });
  if (!packageRoot) {
    return null;
  }

  const packageDocs = path.join(packageRoot, "docs");
  return isUsableDocsDir(packageDocs) ? packageDocs : null;
}

export async function resolveFirstNexusSourcePath(
  params: ResolveFirstNexusReferencePathParams,
): Promise<string | null> {
  const packageRoot = await resolveFirstNexusPackageRoot({
    cwd: params.cwd,
    argv1: params.argv1,
    moduleUrl: params.moduleUrl,
  });
  if (!packageRoot || !isGitCheckout(packageRoot)) {
    return null;
  }
  return packageRoot;
}

export async function resolveFirstNexusReferencePaths(
  params: ResolveFirstNexusReferencePathParams,
): Promise<{
  docsPath: string | null;
  sourcePath: string | null;
}> {
  const [docsPath, sourcePath] = await Promise.all([
    resolveFirstNexusDocsPath(params),
    resolveFirstNexusSourcePath(params),
  ]);
  return { docsPath, sourcePath };
}
