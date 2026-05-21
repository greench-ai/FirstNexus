import { describeGithubCopilotProviderAuthContract } from "FirstNexus/plugin-sdk/provider-test-contracts";

describeGithubCopilotProviderAuthContract(() => import("./index.js"));
