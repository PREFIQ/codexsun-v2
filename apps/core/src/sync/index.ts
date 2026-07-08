import { coreCommonSyncRules } from "../modules/common/sync/index.js";
import { coreMasterSyncRules } from "../modules/master/sync/index.js";

export const coreSyncRules = [
  ...coreCommonSyncRules,
  ...coreMasterSyncRules,
];
