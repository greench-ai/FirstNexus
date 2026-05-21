import { describeOpenAIProviderRuntimeContract } from "FirstNexus/plugin-sdk/provider-test-contracts";

describeOpenAIProviderRuntimeContract(() => import("./index.js"));
