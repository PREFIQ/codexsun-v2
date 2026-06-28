import { createApp } from "./app.js";
import { env } from "./env.js";

const app = await createApp();

try {
  await app.listen({
    host: env.PLATFORM_API_HOST,
    port: env.PLATFORM_API_PORT
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
