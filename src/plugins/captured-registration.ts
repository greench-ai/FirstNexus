import type {
  AnyAgentTool,
  ImageGenerationProviderPlugin,
  MediaUnderstandingProviderPlugin,
  NexusClawPluginApi,
  ProviderPlugin,
  SpeechProviderPlugin,
  WebSearchProviderPlugin,
} from "./types.js";

export type CapturedPluginRegistration = {
  api: NexusClawPluginApi;
  providers: ProviderPlugin[];
  speechProviders: SpeechProviderPlugin[];
  mediaUnderstandingProviders: MediaUnderstandingProviderPlugin[];
  imageGenerationProviders: ImageGenerationProviderPlugin[];
  webSearchProviders: WebSearchProviderPlugin[];
  tools: AnyAgentTool[];
};

export function createCapturedPluginRegistration(): CapturedPluginRegistration {
  const providers: ProviderPlugin[] = [];
  const speechProviders: SpeechProviderPlugin[] = [];
  const mediaUnderstandingProviders: MediaUnderstandingProviderPlugin[] = [];
  const imageGenerationProviders: ImageGenerationProviderPlugin[] = [];
  const webSearchProviders: WebSearchProviderPlugin[] = [];
  const tools: AnyAgentTool[] = [];

  return {
    providers,
    speechProviders,
    mediaUnderstandingProviders,
    imageGenerationProviders,
    webSearchProviders,
    tools,
    api: {
      registerProvider(provider: ProviderPlugin) {
        providers.push(provider);
      },
      registerSpeechProvider(provider: SpeechProviderPlugin) {
        speechProviders.push(provider);
      },
      registerMediaUnderstandingProvider(provider: MediaUnderstandingProviderPlugin) {
        mediaUnderstandingProviders.push(provider);
      },
      registerImageGenerationProvider(provider: ImageGenerationProviderPlugin) {
        imageGenerationProviders.push(provider);
      },
      registerWebSearchProvider(provider: WebSearchProviderPlugin) {
        webSearchProviders.push(provider);
      },
      registerTool(tool: AnyAgentTool) {
        tools.push(tool);
      },
    } as NexusClawPluginApi,
  };
}

export function capturePluginRegistration(params: {
  register(api: NexusClawPluginApi): void;
}): CapturedPluginRegistration {
  const captured = createCapturedPluginRegistration();
  params.register(captured.api);
  return captured;
}
