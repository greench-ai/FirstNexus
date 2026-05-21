import { describeVeniceProviderRuntimeContract } from "FirstNexus/plugin-sdk/provider-test-contracts";

describeVeniceProviderRuntimeContract(() => import("./index.js"));
