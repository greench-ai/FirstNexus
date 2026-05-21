import { describeOpenRouterProviderRuntimeContract } from "FirstNexus/plugin-sdk/provider-test-contracts";

describeOpenRouterProviderRuntimeContract(() => import("./index.js"));
