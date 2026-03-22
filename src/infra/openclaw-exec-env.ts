export const NEXUSCLAW_CLI_ENV_VAR = "NEXUSCLAW_CLI";
export const NEXUSCLAW_CLI_ENV_VALUE = "1";

export function markNexusClawExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [NEXUSCLAW_CLI_ENV_VAR]: NEXUSCLAW_CLI_ENV_VALUE,
  };
}

export function ensureNexusClawExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[NEXUSCLAW_CLI_ENV_VAR] = NEXUSCLAW_CLI_ENV_VALUE;
  return env;
}
