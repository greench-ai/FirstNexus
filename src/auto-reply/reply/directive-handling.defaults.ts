import {
  buildModelAliasIndex,
  type ModelAliasIndex,
  resolveDefaultModelForAgent,
} from "../../agents/model-selection.js";
import type { FirstNexusConfig } from "../../config/types.FirstNexus.js";

export function resolveDefaultModel(params: { cfg: FirstNexusConfig; agentId?: string }): {
  defaultProvider: string;
  defaultModel: string;
  aliasIndex: ModelAliasIndex;
} {
  const mainModel = resolveDefaultModelForAgent({
    cfg: params.cfg,
    agentId: params.agentId,
  });
  const defaultProvider = mainModel.provider;
  const defaultModel = mainModel.model;
  const aliasIndex = buildModelAliasIndex({
    cfg: params.cfg,
    defaultProvider,
  });
  return { defaultProvider, defaultModel, aliasIndex };
}
