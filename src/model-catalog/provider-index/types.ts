import type { ModelCatalogProvider } from "../types.js";

export type FirstNexusProviderIndexPluginInstall = {
  clawhubSpec?: string;
  npmSpec?: string;
  defaultChoice?: "clawhub" | "npm";
  minHostVersion?: string;
  expectedIntegrity?: string;
};

export type FirstNexusProviderIndexPlugin = {
  id: string;
  package?: string;
  source?: string;
  install?: FirstNexusProviderIndexPluginInstall;
};

export type FirstNexusProviderIndexProviderAuthChoice = {
  method: string;
  choiceId: string;
  choiceLabel: string;
  choiceHint?: string;
  assistantPriority?: number;
  assistantVisibility?: "visible" | "manual-only";
  groupId?: string;
  groupLabel?: string;
  groupHint?: string;
  optionKey?: string;
  cliFlag?: string;
  cliOption?: string;
  cliDescription?: string;
  onboardingScopes?: readonly ("text-inference" | "image-generation")[];
};

export type FirstNexusProviderIndexProvider = {
  id: string;
  name: string;
  plugin: FirstNexusProviderIndexPlugin;
  docs?: string;
  categories?: readonly string[];
  authChoices?: readonly FirstNexusProviderIndexProviderAuthChoice[];
  previewCatalog?: ModelCatalogProvider;
};

export type FirstNexusProviderIndex = {
  version: number;
  providers: Readonly<Record<string, FirstNexusProviderIndexProvider>>;
};
