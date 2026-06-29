import { AppError } from "@codexsun/framework/errors";
import {
  type PermissionDefinition,
  buildPermissionName,
  userTypeHasPermission,
  type UserType
} from "./contracts.js";

export class PermissionService {
  check(userType: UserType, permission: string): void {
    if (!userTypeHasPermission(userType, permission)) {
      throw AppError.forbidden(`Missing permission: ${permission}`);
    }
  }

  buildName(input: Omit<PermissionDefinition, "permission">): string {
    return buildPermissionName({ ...input });
  }

  hasPermission(userType: UserType, permission: string): boolean {
    return userTypeHasPermission(userType, permission);
  }
}
