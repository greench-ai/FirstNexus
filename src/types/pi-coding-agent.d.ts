export type FirstNexusPiCodingAgentSkillSourceAugmentation = never;

declare module "@earendil-works/pi-coding-agent" {
  interface Skill {
    // FirstNexus relies on the source identifier returned by pi skill loaders.
    source: string;
  }
}
