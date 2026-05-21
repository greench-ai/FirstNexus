import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";

export function makeQqbotSecretRefConfig(): FirstNexusConfig {
  return {
    channels: {
      qqbot: {
        appId: "123456",
        clientSecret: {
          source: "env",
          provider: "default",
          id: "QQBOT_CLIENT_SECRET",
        },
      },
    },
  } as FirstNexusConfig;
}

export function makeQqbotDefaultAccountConfig(): FirstNexusConfig {
  return {
    channels: {
      qqbot: {
        defaultAccount: "bot2",
        accounts: {
          bot2: { appId: "123456" },
        },
      },
    },
  } as FirstNexusConfig;
}
