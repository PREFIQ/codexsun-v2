import { z } from "zod";

export const platformDeskSchema = z.enum(["sa", "admin", "tenant"]);
export const authModeSchema = z.enum(["cookie", "jwt", "hybrid"]);

export const loginRequestSchema = z.object({
  desk: platformDeskSchema,
  email: z.string().email(),
  password: z.string().min(1),
  tenantCode: z.string().optional()
});

export type AuthMode = z.infer<typeof authModeSchema>;
export type PlatformDesk = z.infer<typeof platformDeskSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export function deskToUserType(desk: PlatformDesk) {
  return desk === "sa" ? "super_admin" : desk === "admin" ? "staff" : "tenant";
}
