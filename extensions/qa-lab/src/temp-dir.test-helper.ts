import {
  tempWorkspace,
  resolvePreferredFirstNexusTmpDir,
  type TempWorkspace,
} from "FirstNexus/plugin-sdk/temp-path";

export function createTempDirHarness() {
  const tempDirs: TempWorkspace[] = [];

  return {
    async cleanup() {
      await Promise.all(tempDirs.splice(0).map((dir) => dir.cleanup()));
    },
    async makeTempDir(prefix: string) {
      const dir = await tempWorkspace({
        rootDir: resolvePreferredFirstNexusTmpDir(),
        prefix,
      });
      tempDirs.push(dir);
      return dir.dir;
    },
  };
}
