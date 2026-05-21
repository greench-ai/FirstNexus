import { describeAnthropicProviderRuntimeContract } from "FirstNexus/plugin-sdk/provider-test-contracts";

describeAnthropicProviderRuntimeContract(() => import("./index.js"));
