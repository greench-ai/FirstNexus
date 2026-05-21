export const NEXISCLAW_CLI_ENV_VAR = "NEXISCLAW_CLI";
export const NEXISCLAW_CLI_ENV_VALUE = "1";

export function markFirstNexusExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [NEXISCLAW_CLI_ENV_VAR]: NEXISCLAW_CLI_ENV_VALUE,
  };
}

export function ensureFirstNexusExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[NEXISCLAW_CLI_ENV_VAR] = NEXISCLAW_CLI_ENV_VALUE;
  return env;
}
