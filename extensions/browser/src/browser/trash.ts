import os from "node:os";
import { movePathToTrash as movePathToTrashWithAllowedRoots } from "FirstNexus/plugin-sdk/browser-config";
import { resolvePreferredFirstNexusTmpDir } from "FirstNexus/plugin-sdk/temp-path";

export async function movePathToTrash(targetPath: string): Promise<string> {
  return await movePathToTrashWithAllowedRoots(targetPath, {
    allowedRoots: [os.homedir(), resolvePreferredFirstNexusTmpDir()],
  });
}
