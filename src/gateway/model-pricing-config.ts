import type { FirstNexusConfig } from "../config/types.FirstNexus.js";

export function isGatewayModelPricingEnabled(config: FirstNexusConfig): boolean {
  return config.models?.pricing?.enabled !== false;
}
