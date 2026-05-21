import { describeGithubCopilotProviderRuntimeContract } from "FirstNexus/plugin-sdk/provider-test-contracts";

describeGithubCopilotProviderRuntimeContract(() => import("./index.js"));
