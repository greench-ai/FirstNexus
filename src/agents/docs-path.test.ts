import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveFirstNexusDocsPath,
  resolveFirstNexusReferencePaths,
  resolveFirstNexusSourcePath,
} from "./docs-path.js";

async function makePackageRoot(prefix: string): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await fs.writeFile(path.join(root, "package.json"), '{"name":"FirstNexus"}\n');
  return root;
}

async function writeDocsJson(root: string): Promise<void> {
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(path.join(root, "docs", "docs.json"), "{}\n");
}

describe("resolveFirstNexusDocsPath", () => {
  it("uses the workspace docs directory when it has canonical docs metadata", async () => {
    const root = await makePackageRoot("FirstNexus-docs-workspace-");
    await writeDocsJson(root);

    await expect(resolveFirstNexusDocsPath({ workspaceDir: root })).resolves.toBe(
      path.join(root, "docs"),
    );
  });

  it("finds bundled package docs from a nested package path", async () => {
    const root = await makePackageRoot("FirstNexus-docs-package-");
    await writeDocsJson(root);
    const nested = path.join(root, "dist", "agents");
    await fs.mkdir(nested, { recursive: true });

    await expect(resolveFirstNexusDocsPath({ cwd: nested })).resolves.toBe(path.join(root, "docs"));
  });

  it("does not accept incomplete template-only docs directories", async () => {
    const root = await makePackageRoot("FirstNexus-docs-incomplete-");
    await fs.mkdir(path.join(root, "docs", "reference", "templates"), { recursive: true });

    await expect(resolveFirstNexusDocsPath({ cwd: root })).resolves.toBeNull();
  });
});

describe("resolveFirstNexusSourcePath", () => {
  it("returns the package root only for git checkouts", async () => {
    const root = await makePackageRoot("FirstNexus-source-git-");
    await fs.mkdir(path.join(root, ".git"));

    await expect(resolveFirstNexusSourcePath({ cwd: root })).resolves.toBe(root);
  });

  it("omits source path for npm-style package installs", async () => {
    const root = await makePackageRoot("FirstNexus-source-npm-");

    await expect(resolveFirstNexusSourcePath({ cwd: root })).resolves.toBeNull();
  });
});

describe("resolveFirstNexusReferencePaths", () => {
  it("returns docs and local source together for git checkouts", async () => {
    const root = await makePackageRoot("FirstNexus-reference-git-");
    await writeDocsJson(root);
    await fs.mkdir(path.join(root, ".git"));

    await expect(resolveFirstNexusReferencePaths({ cwd: root })).resolves.toEqual({
      docsPath: path.join(root, "docs"),
      sourcePath: root,
    });
  });
});
