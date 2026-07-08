import { coreCommonMigrations } from "../modules/common/migrations/index.js";
import { coreMasterMigrations } from "../modules/master/migrations/index.js";

export const coreMigrations = [
  ...coreCommonMigrations,
  ...coreMasterMigrations,
];
