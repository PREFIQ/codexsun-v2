import { coreCommonWorkers } from "../modules/common/workers/index.js";
import { coreMasterWorkers } from "../modules/master/workers/index.js";

export const coreWorkers = [
  ...coreCommonWorkers,
  ...coreMasterWorkers,
];
