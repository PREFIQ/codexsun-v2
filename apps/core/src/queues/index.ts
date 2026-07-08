import { coreCommonQueues } from "../modules/common/queues/index.js";
import { coreMasterQueues } from "../modules/master/queues/index.js";

export const coreQueues = [
  ...coreCommonQueues,
  ...coreMasterQueues,
];
