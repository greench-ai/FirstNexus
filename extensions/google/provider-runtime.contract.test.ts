import { describeGoogleProviderRuntimeContract } from "FirstNexus/plugin-sdk/provider-test-contracts";

describeGoogleProviderRuntimeContract(() => import("./index.js"));
