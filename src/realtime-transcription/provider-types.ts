import type { FirstNexusConfig } from "../config/types.FirstNexus.js";

export type RealtimeTranscriptionProviderId = string;

export type RealtimeTranscriptionProviderConfig = Record<string, unknown>;

export type RealtimeTranscriptionProviderResolveConfigContext = {
  cfg: FirstNexusConfig;
  rawConfig: RealtimeTranscriptionProviderConfig;
};

export type RealtimeTranscriptionProviderConfiguredContext = {
  cfg?: FirstNexusConfig;
  providerConfig: RealtimeTranscriptionProviderConfig;
};

export type RealtimeTranscriptionSessionCallbacks = {
  onPartial?: (partial: string) => void;
  onTranscript?: (transcript: string) => void;
  onSpeechStart?: () => void;
  onError?: (error: Error) => void;
};

export type RealtimeTranscriptionSessionCreateRequest = RealtimeTranscriptionSessionCallbacks & {
  cfg?: FirstNexusConfig;
  providerConfig: RealtimeTranscriptionProviderConfig;
};

export type RealtimeTranscriptionSession = {
  connect(): Promise<void>;
  sendAudio(audio: Buffer): void;
  close(): void;
  isConnected(): boolean;
};
