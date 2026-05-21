import type { FirstNexusConfig } from "../config/types.FirstNexus.js";
import { attachPluginApiFacades, type FirstNexusPluginApiWithoutFacades } from "./api-facades.js";
import type { PluginRuntime } from "./runtime/types.js";
import type { FirstNexusPluginApi, PluginLogger } from "./types.js";

export type BuildPluginApiParams = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  rootDir?: string;
  registrationMode: FirstNexusPluginApi["registrationMode"];
  config: FirstNexusConfig;
  pluginConfig?: Record<string, unknown>;
  runtime: PluginRuntime;
  logger: PluginLogger;
  resolvePath: (input: string) => string;
  handlers?: Partial<
    Pick<
      FirstNexusPluginApi,
      | "registerTool"
      | "registerHook"
      | "registerHttpRoute"
      | "registerHostedMediaResolver"
      | "registerChannel"
      | "registerGatewayMethod"
      | "registerCli"
      | "registerReload"
      | "registerNodeHostCommand"
      | "registerNodeInvokePolicy"
      | "registerSecurityAuditCollector"
      | "registerService"
      | "registerGatewayDiscoveryService"
      | "registerCliBackend"
      | "registerTextTransforms"
      | "registerConfigMigration"
      | "registerMigrationProvider"
      | "registerAutoEnableProbe"
      | "registerProvider"
      | "registerModelCatalogProvider"
      | "registerSpeechProvider"
      | "registerRealtimeTranscriptionProvider"
      | "registerRealtimeVoiceProvider"
      | "registerMediaUnderstandingProvider"
      | "registerImageGenerationProvider"
      | "registerVideoGenerationProvider"
      | "registerMusicGenerationProvider"
      | "registerWebFetchProvider"
      | "registerWebSearchProvider"
      | "registerInteractiveHandler"
      | "onConversationBindingResolved"
      | "registerCommand"
      | "registerContextEngine"
      | "registerCompactionProvider"
      | "registerAgentHarness"
      | "registerCodexAppServerExtensionFactory"
      | "registerAgentToolResultMiddleware"
      | "registerSessionExtension"
      | "enqueueNextTurnInjection"
      | "registerTrustedToolPolicy"
      | "registerToolMetadata"
      | "registerControlUiDescriptor"
      | "registerRuntimeLifecycle"
      | "registerAgentEventSubscription"
      | "emitAgentEvent"
      | "setRunContext"
      | "getRunContext"
      | "clearRunContext"
      | "registerSessionSchedulerJob"
      | "registerSessionAction"
      | "sendSessionAttachment"
      | "scheduleSessionTurn"
      | "unscheduleSessionTurnsByTag"
      | "registerDetachedTaskRuntime"
      | "registerMemoryCapability"
      | "registerMemoryPromptSection"
      | "registerMemoryPromptSupplement"
      | "registerMemoryCorpusSupplement"
      | "registerMemoryFlushPlan"
      | "registerMemoryRuntime"
      | "registerMemoryEmbeddingProvider"
      | "on"
    >
  >;
};

const noopRegisterTool: FirstNexusPluginApi["registerTool"] = () => {};
const noopRegisterHook: FirstNexusPluginApi["registerHook"] = () => {};
const noopRegisterHttpRoute: FirstNexusPluginApi["registerHttpRoute"] = () => {};
const noopRegisterHostedMediaResolver: FirstNexusPluginApi["registerHostedMediaResolver"] =
  () => {};
const noopRegisterChannel: FirstNexusPluginApi["registerChannel"] = () => {};
const noopRegisterGatewayMethod: FirstNexusPluginApi["registerGatewayMethod"] = () => {};
const noopRegisterCli: FirstNexusPluginApi["registerCli"] = () => {};
const noopRegisterReload: FirstNexusPluginApi["registerReload"] = () => {};
const noopRegisterNodeHostCommand: FirstNexusPluginApi["registerNodeHostCommand"] = () => {};
const noopRegisterNodeInvokePolicy: FirstNexusPluginApi["registerNodeInvokePolicy"] = () => {};
const noopRegisterSecurityAuditCollector: FirstNexusPluginApi["registerSecurityAuditCollector"] =
  () => {};
const noopRegisterService: FirstNexusPluginApi["registerService"] = () => {};
const noopRegisterGatewayDiscoveryService: FirstNexusPluginApi["registerGatewayDiscoveryService"] =
  () => {};
const noopRegisterCliBackend: FirstNexusPluginApi["registerCliBackend"] = () => {};
const noopRegisterTextTransforms: FirstNexusPluginApi["registerTextTransforms"] = () => {};
const noopRegisterConfigMigration: FirstNexusPluginApi["registerConfigMigration"] = () => {};
const noopRegisterMigrationProvider: FirstNexusPluginApi["registerMigrationProvider"] = () => {};
const noopRegisterAutoEnableProbe: FirstNexusPluginApi["registerAutoEnableProbe"] = () => {};
const noopRegisterProvider: FirstNexusPluginApi["registerProvider"] = () => {};
const noopRegisterModelCatalogProvider: FirstNexusPluginApi["registerModelCatalogProvider"] =
  () => {};
const noopRegisterSpeechProvider: FirstNexusPluginApi["registerSpeechProvider"] = () => {};
const noopRegisterRealtimeTranscriptionProvider: FirstNexusPluginApi["registerRealtimeTranscriptionProvider"] =
  () => {};
const noopRegisterRealtimeVoiceProvider: FirstNexusPluginApi["registerRealtimeVoiceProvider"] =
  () => {};
const noopRegisterMediaUnderstandingProvider: FirstNexusPluginApi["registerMediaUnderstandingProvider"] =
  () => {};
const noopRegisterImageGenerationProvider: FirstNexusPluginApi["registerImageGenerationProvider"] =
  () => {};
const noopRegisterVideoGenerationProvider: FirstNexusPluginApi["registerVideoGenerationProvider"] =
  () => {};
const noopRegisterMusicGenerationProvider: FirstNexusPluginApi["registerMusicGenerationProvider"] =
  () => {};
const noopRegisterWebFetchProvider: FirstNexusPluginApi["registerWebFetchProvider"] = () => {};
const noopRegisterWebSearchProvider: FirstNexusPluginApi["registerWebSearchProvider"] = () => {};
const noopRegisterInteractiveHandler: FirstNexusPluginApi["registerInteractiveHandler"] = () => {};
const noopOnConversationBindingResolved: FirstNexusPluginApi["onConversationBindingResolved"] =
  () => {};
const noopRegisterCommand: FirstNexusPluginApi["registerCommand"] = () => {};
const noopRegisterContextEngine: FirstNexusPluginApi["registerContextEngine"] = () => {};
const noopRegisterCompactionProvider: FirstNexusPluginApi["registerCompactionProvider"] = () => {};
const noopRegisterAgentHarness: FirstNexusPluginApi["registerAgentHarness"] = () => {};
const noopRegisterCodexAppServerExtensionFactory: FirstNexusPluginApi["registerCodexAppServerExtensionFactory"] =
  () => {};
const noopRegisterAgentToolResultMiddleware: FirstNexusPluginApi["registerAgentToolResultMiddleware"] =
  () => {};
const noopRegisterSessionExtension: FirstNexusPluginApi["registerSessionExtension"] = () => {};
const noopEnqueueNextTurnInjection: FirstNexusPluginApi["enqueueNextTurnInjection"] = async (
  injection,
) => ({ enqueued: false, id: "", sessionKey: injection.sessionKey });
const noopRegisterTrustedToolPolicy: FirstNexusPluginApi["registerTrustedToolPolicy"] = () => {};
const noopRegisterToolMetadata: FirstNexusPluginApi["registerToolMetadata"] = () => {};
const noopRegisterControlUiDescriptor: FirstNexusPluginApi["registerControlUiDescriptor"] =
  () => {};
const noopRegisterRuntimeLifecycle: FirstNexusPluginApi["registerRuntimeLifecycle"] = () => {};
const noopRegisterAgentEventSubscription: FirstNexusPluginApi["registerAgentEventSubscription"] =
  () => {};
const noopEmitAgentEvent: FirstNexusPluginApi["emitAgentEvent"] = () => ({
  emitted: false,
  reason: "not wired",
});
const noopSetRunContext: FirstNexusPluginApi["setRunContext"] = () => false;
const noopGetRunContext: FirstNexusPluginApi["getRunContext"] = () => undefined;
const noopClearRunContext: FirstNexusPluginApi["clearRunContext"] = () => {};
const noopRegisterSessionSchedulerJob: FirstNexusPluginApi["registerSessionSchedulerJob"] = () =>
  undefined;
const noopRegisterSessionAction: FirstNexusPluginApi["registerSessionAction"] = () => {};
const noopSendSessionAttachment: FirstNexusPluginApi["sendSessionAttachment"] = async () => ({
  ok: false,
  error: "not wired",
});
const noopScheduleSessionTurn: FirstNexusPluginApi["scheduleSessionTurn"] = async () => undefined;
const noopUnscheduleSessionTurnsByTag: FirstNexusPluginApi["unscheduleSessionTurnsByTag"] =
  async () => ({ removed: 0, failed: 0 });
const noopRegisterDetachedTaskRuntime: FirstNexusPluginApi["registerDetachedTaskRuntime"] =
  () => {};
const noopRegisterMemoryCapability: FirstNexusPluginApi["registerMemoryCapability"] = () => {};
const noopRegisterMemoryPromptSection: FirstNexusPluginApi["registerMemoryPromptSection"] =
  () => {};
const noopRegisterMemoryPromptSupplement: FirstNexusPluginApi["registerMemoryPromptSupplement"] =
  () => {};
const noopRegisterMemoryCorpusSupplement: FirstNexusPluginApi["registerMemoryCorpusSupplement"] =
  () => {};
const noopRegisterMemoryFlushPlan: FirstNexusPluginApi["registerMemoryFlushPlan"] = () => {};
const noopRegisterMemoryRuntime: FirstNexusPluginApi["registerMemoryRuntime"] = () => {};
const noopRegisterMemoryEmbeddingProvider: FirstNexusPluginApi["registerMemoryEmbeddingProvider"] =
  () => {};
const noopOn: FirstNexusPluginApi["on"] = () => {};

export function buildPluginApi(params: BuildPluginApiParams): FirstNexusPluginApi {
  const handlers = params.handlers ?? {};
  const registerCli = handlers.registerCli ?? noopRegisterCli;
  const api: FirstNexusPluginApiWithoutFacades = {
    id: params.id,
    name: params.name,
    version: params.version,
    description: params.description,
    source: params.source,
    rootDir: params.rootDir,
    registrationMode: params.registrationMode,
    config: params.config,
    pluginConfig: params.pluginConfig,
    runtime: params.runtime,
    logger: params.logger,
    registerTool: handlers.registerTool ?? noopRegisterTool,
    registerHook: handlers.registerHook ?? noopRegisterHook,
    registerHttpRoute: handlers.registerHttpRoute ?? noopRegisterHttpRoute,
    registerHostedMediaResolver:
      handlers.registerHostedMediaResolver ?? noopRegisterHostedMediaResolver,
    registerChannel: handlers.registerChannel ?? noopRegisterChannel,
    registerGatewayMethod: handlers.registerGatewayMethod ?? noopRegisterGatewayMethod,
    registerCli,
    registerNodeCliFeature: (registrar, opts) =>
      registerCli(registrar, {
        ...opts,
        parentPath: ["nodes"],
      }),
    registerReload: handlers.registerReload ?? noopRegisterReload,
    registerNodeHostCommand: handlers.registerNodeHostCommand ?? noopRegisterNodeHostCommand,
    registerNodeInvokePolicy: handlers.registerNodeInvokePolicy ?? noopRegisterNodeInvokePolicy,
    registerSecurityAuditCollector:
      handlers.registerSecurityAuditCollector ?? noopRegisterSecurityAuditCollector,
    registerService: handlers.registerService ?? noopRegisterService,
    registerGatewayDiscoveryService:
      handlers.registerGatewayDiscoveryService ?? noopRegisterGatewayDiscoveryService,
    registerCliBackend: handlers.registerCliBackend ?? noopRegisterCliBackend,
    registerTextTransforms: handlers.registerTextTransforms ?? noopRegisterTextTransforms,
    registerConfigMigration: handlers.registerConfigMigration ?? noopRegisterConfigMigration,
    registerMigrationProvider: handlers.registerMigrationProvider ?? noopRegisterMigrationProvider,
    registerAutoEnableProbe: handlers.registerAutoEnableProbe ?? noopRegisterAutoEnableProbe,
    registerProvider: handlers.registerProvider ?? noopRegisterProvider,
    registerModelCatalogProvider:
      handlers.registerModelCatalogProvider ?? noopRegisterModelCatalogProvider,
    registerSpeechProvider: handlers.registerSpeechProvider ?? noopRegisterSpeechProvider,
    registerRealtimeTranscriptionProvider:
      handlers.registerRealtimeTranscriptionProvider ?? noopRegisterRealtimeTranscriptionProvider,
    registerRealtimeVoiceProvider:
      handlers.registerRealtimeVoiceProvider ?? noopRegisterRealtimeVoiceProvider,
    registerMediaUnderstandingProvider:
      handlers.registerMediaUnderstandingProvider ?? noopRegisterMediaUnderstandingProvider,
    registerImageGenerationProvider:
      handlers.registerImageGenerationProvider ?? noopRegisterImageGenerationProvider,
    registerVideoGenerationProvider:
      handlers.registerVideoGenerationProvider ?? noopRegisterVideoGenerationProvider,
    registerMusicGenerationProvider:
      handlers.registerMusicGenerationProvider ?? noopRegisterMusicGenerationProvider,
    registerWebFetchProvider: handlers.registerWebFetchProvider ?? noopRegisterWebFetchProvider,
    registerWebSearchProvider: handlers.registerWebSearchProvider ?? noopRegisterWebSearchProvider,
    registerInteractiveHandler:
      handlers.registerInteractiveHandler ?? noopRegisterInteractiveHandler,
    onConversationBindingResolved:
      handlers.onConversationBindingResolved ?? noopOnConversationBindingResolved,
    registerCommand: handlers.registerCommand ?? noopRegisterCommand,
    registerContextEngine: handlers.registerContextEngine ?? noopRegisterContextEngine,
    registerCompactionProvider:
      handlers.registerCompactionProvider ?? noopRegisterCompactionProvider,
    registerAgentHarness: handlers.registerAgentHarness ?? noopRegisterAgentHarness,
    registerCodexAppServerExtensionFactory:
      handlers.registerCodexAppServerExtensionFactory ?? noopRegisterCodexAppServerExtensionFactory,
    registerAgentToolResultMiddleware:
      handlers.registerAgentToolResultMiddleware ?? noopRegisterAgentToolResultMiddleware,
    registerSessionExtension: handlers.registerSessionExtension ?? noopRegisterSessionExtension,
    enqueueNextTurnInjection: handlers.enqueueNextTurnInjection ?? noopEnqueueNextTurnInjection,
    registerTrustedToolPolicy: handlers.registerTrustedToolPolicy ?? noopRegisterTrustedToolPolicy,
    registerToolMetadata: handlers.registerToolMetadata ?? noopRegisterToolMetadata,
    registerControlUiDescriptor:
      handlers.registerControlUiDescriptor ?? noopRegisterControlUiDescriptor,
    registerRuntimeLifecycle: handlers.registerRuntimeLifecycle ?? noopRegisterRuntimeLifecycle,
    registerAgentEventSubscription:
      handlers.registerAgentEventSubscription ?? noopRegisterAgentEventSubscription,
    emitAgentEvent: handlers.emitAgentEvent ?? noopEmitAgentEvent,
    setRunContext: handlers.setRunContext ?? noopSetRunContext,
    getRunContext: handlers.getRunContext ?? noopGetRunContext,
    clearRunContext: handlers.clearRunContext ?? noopClearRunContext,
    registerSessionSchedulerJob:
      handlers.registerSessionSchedulerJob ?? noopRegisterSessionSchedulerJob,
    registerSessionAction: handlers.registerSessionAction ?? noopRegisterSessionAction,
    sendSessionAttachment: handlers.sendSessionAttachment ?? noopSendSessionAttachment,
    scheduleSessionTurn: handlers.scheduleSessionTurn ?? noopScheduleSessionTurn,
    unscheduleSessionTurnsByTag:
      handlers.unscheduleSessionTurnsByTag ?? noopUnscheduleSessionTurnsByTag,
    registerDetachedTaskRuntime:
      handlers.registerDetachedTaskRuntime ?? noopRegisterDetachedTaskRuntime,
    registerMemoryCapability: handlers.registerMemoryCapability ?? noopRegisterMemoryCapability,
    registerMemoryPromptSection:
      handlers.registerMemoryPromptSection ?? noopRegisterMemoryPromptSection,
    registerMemoryPromptSupplement:
      handlers.registerMemoryPromptSupplement ?? noopRegisterMemoryPromptSupplement,
    registerMemoryCorpusSupplement:
      handlers.registerMemoryCorpusSupplement ?? noopRegisterMemoryCorpusSupplement,
    registerMemoryFlushPlan: handlers.registerMemoryFlushPlan ?? noopRegisterMemoryFlushPlan,
    registerMemoryRuntime: handlers.registerMemoryRuntime ?? noopRegisterMemoryRuntime,
    registerMemoryEmbeddingProvider:
      handlers.registerMemoryEmbeddingProvider ?? noopRegisterMemoryEmbeddingProvider,
    resolvePath: params.resolvePath,
    on: handlers.on ?? noopOn,
  };
  return attachPluginApiFacades(api);
}
