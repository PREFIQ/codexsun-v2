import { registerGracefulShutdown } from "@codexsun/framework/api";
import { createApp } from "./app.js";
import { env } from "./env.js";

const app = await createApp();
registerGracefulShutdown(app);

function isAddressInUseError(error: unknown): error is { code: "EADDRINUSE" } {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EADDRINUSE";
}

async function startServer(retries = 15, delay = 250) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const address = await app.listen({
        host: env.PLATFORM_API_HOST,
        port: env.PLATFORM_API_PORT
      });
      console.log(`  ok Platform API ready: ${address}`);
      return;
    } catch (error) {
      if (isAddressInUseError(error) && attempt < retries) {
        app.log.warn(`Port ${env.PLATFORM_API_PORT} in use, retrying in ${delay}ms... (attempt ${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        app.log.error(error);
        process.exit(1);
      }
    }
  }
}

await startServer();
