import { coreCommonSeeders } from "../modules/common/seeders/index.js";
import { coreMasterSeeders } from "../modules/master/seeders/index.js";

export const coreSeeders = [
  ...coreCommonSeeders,
  ...coreMasterSeeders,
];
