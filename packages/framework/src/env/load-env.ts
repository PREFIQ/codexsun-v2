import "dotenv/config";
import type { z } from "zod";

export function loadEnv<TSchema extends z.ZodTypeAny>(schema: TSchema): z.infer<TSchema> {
  return schema.parse(process.env);
}
