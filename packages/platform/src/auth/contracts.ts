import { z } from "zod";

export const platformDeskSchema = z.enum(["sa", "admin", "tenant"]);

export const loginRequestSchema = z.object({
  desk: platformDeskSchema,
  email: z.string().email(),
  password: z.string().min(1),
  tenantCode: z.string().default("test")
});

export type PlatformDesk = z.infer<typeof platformDeskSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export function deskToUserType(desk: PlatformDesk) {
  return desk === "sa" ? "super_admin" : desk === "admin" ? "staff" : "tenant";
}
