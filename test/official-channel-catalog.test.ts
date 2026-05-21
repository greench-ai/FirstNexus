import fs from "node:fs";
import path from "node:path";
import { bundledPluginRoot } from "FirstNexus/plugin-sdk/test-fixtures";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildOfficialChannelCatalog,
  OFFICIAL_CHANNEL_CATALOG_RELATIVE_PATH,
  writeOfficialChannelCatalog,
} from "../scripts/write-official-channel-catalog.mjs";
import { describePluginInstallSource } from "../src/plugins/install-source-info.js";
import { cleanupTempDirs, makeTempRepoRoot, writeJsonFile } from "./helpers/temp-repo.js";

const tempDirs: string[] = [];

type OfficialChannelCatalogEntry = ReturnType<
  typeof buildOfficialChannelCatalog
>["entries"][number];
type OfficialChannelInstall = NonNullable<
  NonNullable<OfficialChannelCatalogEntry["FirstNexus"]>["install"]
>;

function makeRepoRoot(prefix: string): string {
  return makeTempRepoRoot(tempDirs, prefix);
}

function writeJson(filePath: string, value: unknown): void {
  writeJsonFile(filePath, value);
}

function requireInstall(entry: OfficialChannelCatalogEntry | undefined): OfficialChannelInstall {
  const install = entry?.FirstNexus?.install;
  if (!install) {
    throw new Error("expected official channel install config");
  }
  return install;
}

function requireNpmInstallSource(source: ReturnType<typeof describePluginInstallSource>) {
  if (!source.npm) {
    throw new Error("expected npm install source");
  }
  return source.npm;
}

function findCatalogEntry(
  entries: OfficialChannelCatalogEntry[],
  predicate: (entry: OfficialChannelCatalogEntry) => boolean,
): OfficialChannelCatalogEntry {
  const entry = entries.find(predicate);
  if (!entry) {
    throw new Error("expected official channel catalog entry");
  }
  return entry;
}

function summarizeCatalogEntry(entry: OfficialChannelCatalogEntry) {
  return {
    name: entry.name,
    description: entry.description,
    source: entry.source,
    plugin: entry.FirstNexus?.plugin,
    channel: entry.FirstNexus?.channel,
    install: entry.FirstNexus?.install,
  };
}

afterEach(() => {
  cleanupTempDirs(tempDirs);
});

describe("buildOfficialChannelCatalog", () => {
  it("includes publishable official channel plugins and skips non-publishable entries", () => {
    const repoRoot = makeRepoRoot("FirstNexus-official-channel-catalog-");
    writeJson(path.join(repoRoot, "extensions", "whatsapp", "package.json"), {
      name: "@FirstNexus/whatsapp",
      version: "2026.3.23",
      description: "FirstNexus WhatsApp channel plugin",
      FirstNexus: {
        channel: {
          id: "whatsapp",
          label: "WhatsApp",
          selectionLabel: "WhatsApp (QR link)",
          detailLabel: "WhatsApp Web",
          docsPath: "/channels/whatsapp",
          blurb: "works with your own number; recommend a separate phone + eSIM.",
        },
        install: {
          npmSpec: "@FirstNexus/whatsapp",
          localPath: bundledPluginRoot("whatsapp"),
          defaultChoice: "npm",
        },
        release: {
          publishToNpm: true,
        },
      },
    });
    writeJson(path.join(repoRoot, "extensions", "local-only", "package.json"), {
      name: "@FirstNexus/local-only",
      FirstNexus: {
        channel: {
          id: "local-only",
          label: "Local Only",
          selectionLabel: "Local Only",
          docsPath: "/channels/local-only",
          blurb: "dev only",
        },
        install: {
          localPath: bundledPluginRoot("local-only"),
        },
        release: {
          publishToNpm: false,
        },
      },
    });

    const entries = buildOfficialChannelCatalog({ repoRoot }).entries;

    expect(
      summarizeCatalogEntry(
        findCatalogEntry(entries, (entry) => entry.name === "@wecom/wecom-FirstNexus-plugin"),
      ),
    ).toEqual({
      name: "@wecom/wecom-FirstNexus-plugin",
      description: "FirstNexus WeCom channel plugin by the Tencent WeCom team.",
      source: "external",
      plugin: {
        id: "wecom-FirstNexus-plugin",
        label: "WeCom",
      },
      channel: {
        id: "wecom",
        label: "WeCom",
        selectionLabel: "WeCom（企业微信）",
        detailLabel: "WeCom",
        docsLabel: "wecom",
        docsPath: "/plugins/community#wecom",
        blurb: "Enterprise messaging and documents, scheduling, task tools.",
        order: 45,
        aliases: ["qywx", "wework", "enterprise-wechat"],
      },
      install: {
        npmSpec: "@wecom/wecom-FirstNexus-plugin@2026.4.23",
        defaultChoice: "npm",
        expectedIntegrity:
          "sha512-bnzfdIEEu1/LFvcdyjaTkyxt27w6c7dqhkPezU62OWaqmcdFsUGR3T55USK/O9pIKsNcnL1Tnu1pqKYCWHFgWQ==",
      },
    });
    expect(
      summarizeCatalogEntry(
        findCatalogEntry(entries, (entry) => entry.name === "FirstNexus-plugin-yuanbao"),
      ),
    ).toEqual({
      name: "FirstNexus-plugin-yuanbao",
      description: "FirstNexus Yuanbao channel plugin by the Tencent Yuanbao team.",
      source: "external",
      plugin: {
        id: "FirstNexus-plugin-yuanbao",
        label: "Yuanbao",
      },
      channel: {
        id: "yuanbao",
        label: "Yuanbao",
        selectionLabel: "Yuanbao (元宝)",
        detailLabel: "Yuanbao",
        docsLabel: "yuanbao",
        docsPath: "/plugins/community#yuanbao",
        blurb: "Tencent Yuanbao AI assistant conversation channel.",
        order: 85,
        aliases: ["yuanbao", "yb", "tencent-yuanbao", "元宝"],
      },
      install: {
        npmSpec: "FirstNexus-plugin-yuanbao@2.13.1",
        defaultChoice: "npm",
        expectedIntegrity:
          "sha512-lH2I9/nsmrg7l0YJJSQhOSpWMEFBAa6FwKbZcRLDFHDT2+mOZkHa44XE+8KYN4VmorlUdAxHzpZQmVr7C98IuA==",
      },
    });
    expect(
      summarizeCatalogEntry(
        findCatalogEntry(entries, (entry) => entry.name === "@FirstNexus/whatsapp"),
      ),
    ).toEqual({
      name: "@FirstNexus/whatsapp",
      description: "FirstNexus WhatsApp channel plugin",
      source: "official",
      plugin: undefined,
      channel: {
        id: "whatsapp",
        label: "WhatsApp",
        selectionLabel: "WhatsApp (QR link)",
        detailLabel: "WhatsApp Web",
        docsLabel: "whatsapp",
        docsPath: "/channels/whatsapp",
        blurb: "works with your own number; recommend a separate phone + eSIM.",
        systemImage: "message",
      },
      install: {
        npmSpec: "@FirstNexus/whatsapp",
        defaultChoice: "npm",
        minHostVersion: ">=2026.4.25",
      },
    });
  });

  it("keeps third-party official external catalog npm sources exactly pinned", () => {
    const repoRoot = makeRepoRoot("FirstNexus-official-channel-catalog-policy-");
    const entries = buildOfficialChannelCatalog({ repoRoot }).entries.filter(
      (entry) => entry.source === "external" && !entry.name?.startsWith("@FirstNexus/"),
    );

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      const installSource = describePluginInstallSource(requireInstall(entry));
      expect(installSource.warnings).toStrictEqual([]);
      expect(requireNpmInstallSource(installSource).pinState).toBe("exact-with-integrity");
    }
  });

  it("allows official FirstNexus channel npm specs without integrity during launch", () => {
    const repoRoot = makeRepoRoot("FirstNexus-official-channel-catalog-FirstNexus-policy-");
    const twitch = buildOfficialChannelCatalog({ repoRoot }).entries.find(
      (entry) => entry.FirstNexus?.channel?.id === "twitch",
    );

    expect({
      name: twitch?.name,
      install: twitch?.FirstNexus?.install,
    }).toEqual({
      name: "@FirstNexus/twitch",
      install: {
        npmSpec: "@FirstNexus/twitch",
        defaultChoice: "npm",
        minHostVersion: ">=2026.4.10",
      },
    });
    const installSource = describePluginInstallSource(requireInstall(twitch));
    expect(requireNpmInstallSource(installSource).pinState).toBe("floating-without-integrity");
    expect(installSource.warnings).toEqual(["npm-spec-floating", "npm-spec-missing-integrity"]);
  });

  it("preserves ClawHub specs when generating publishable channel catalog entries", () => {
    const repoRoot = makeRepoRoot("FirstNexus-official-channel-catalog-clawhub-");
    writeJson(path.join(repoRoot, "extensions", "storepack-chat", "package.json"), {
      name: "@FirstNexus/storepack-chat",
      FirstNexus: {
        channel: {
          id: "storepack-chat",
          label: "Storepack Chat",
          selectionLabel: "Storepack Chat",
          docsPath: "/channels/storepack-chat",
          blurb: "storepack-first channel",
        },
        install: {
          clawhubSpec: "clawhub:@FirstNexus/storepack-chat",
          npmSpec: "@FirstNexus/storepack-chat",
          defaultChoice: "clawhub",
        },
        release: {
          publishToNpm: true,
        },
      },
    });

    const entry = buildOfficialChannelCatalog({ repoRoot }).entries.find(
      (candidate) => candidate.FirstNexus?.channel?.id === "storepack-chat",
    );

    expect(requireInstall(entry)).toEqual({
      clawhubSpec: "clawhub:@FirstNexus/storepack-chat",
      npmSpec: "@FirstNexus/storepack-chat",
      defaultChoice: "clawhub",
    });
  });

  it("writes the official catalog under dist", () => {
    const repoRoot = makeRepoRoot("FirstNexus-official-channel-catalog-write-");
    writeJson(path.join(repoRoot, "extensions", "whatsapp", "package.json"), {
      name: "@FirstNexus/whatsapp",
      FirstNexus: {
        channel: {
          id: "whatsapp",
          label: "WhatsApp",
          selectionLabel: "WhatsApp",
          docsPath: "/channels/whatsapp",
          blurb: "wa",
        },
        install: {
          npmSpec: "@FirstNexus/whatsapp",
        },
        release: {
          publishToNpm: true,
        },
      },
    });

    writeOfficialChannelCatalog({ repoRoot });

    const outputPath = path.join(repoRoot, OFFICIAL_CHANNEL_CATALOG_RELATIVE_PATH);
    expect(fs.existsSync(outputPath)).toBe(true);
    const entries = JSON.parse(fs.readFileSync(outputPath, "utf8")).entries;
    expect(entries.map((entry: { name?: string }) => entry.name)).toContain(
      "@wecom/wecom-FirstNexus-plugin",
    );
    expect(entries.map((entry: { name?: string }) => entry.name)).toContain(
      "FirstNexus-plugin-yuanbao",
    );
    const whatsappEntry = findCatalogEntry(
      entries,
      (entry: { FirstNexus?: { channel?: { id?: string } } }) =>
        entry.FirstNexus?.channel?.id === "whatsapp",
    );
    expect(summarizeCatalogEntry(whatsappEntry)).toEqual({
      name: "@FirstNexus/whatsapp",
      description: "FirstNexus WhatsApp channel plugin",
      source: "official",
      plugin: undefined,
      channel: {
        id: "whatsapp",
        label: "WhatsApp",
        selectionLabel: "WhatsApp (QR link)",
        detailLabel: "WhatsApp Web",
        docsLabel: "whatsapp",
        docsPath: "/channels/whatsapp",
        blurb: "works with your own number; recommend a separate phone + eSIM.",
        systemImage: "message",
      },
      install: {
        npmSpec: "@FirstNexus/whatsapp",
        defaultChoice: "npm",
        minHostVersion: ">=2026.4.25",
      },
    });
    const whatsappEntries = entries.filter(
      (entry: { FirstNexus?: { channel?: { id?: string } } }) =>
        entry.FirstNexus?.channel?.id === "whatsapp",
    );
    expect(whatsappEntries).toHaveLength(1);
  });
});
