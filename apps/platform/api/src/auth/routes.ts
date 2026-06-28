import "@fastify/cookie";
import { fail, ok } from "@codexsun/framework/http";
import {
  InMemorySessionStore,
  deskToUserType,
  loginRequestSchema,
  verifyPassword
} from "@codexsun/platform/auth";
import type { FastifyInstance } from "fastify";
import { createServerConnection } from "../db/bootstrap.js";
import { env } from "../env.js";

const sessions = new InMemorySessionStore();

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const parsed = loginRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send(
        fail(
          {
          code: "VALIDATION_ERROR",
          message: "Login details are invalid",
          details: parsed.error.flatten()
        },
          {
            requestId: request.id
          }
        )
      );
    }

    const { desk, email, password, tenantCode } = parsed.data;
    const user = await findUser(desk, email);

    if (!user || !verifyPassword(password, user.password_hash as string)) {
      return reply.code(401).send(
        fail(
          {
          code: "INVALID_CREDENTIALS",
          message: "Email or password is incorrect",
          details: {}
        },
          {
            requestId: request.id
          }
        )
      );
    }

    const userType = deskToUserType(desk);

    const sessionInput =
      desk === "tenant"
        ? {
            email,
            tenantCode,
            userType
          }
        : {
            email,
            userType
          };

    const session = sessions.create(sessionInput);

    reply.setCookie("codexsun_session", session.token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: env.NODE_ENV === "production"
    });

    return ok(
      {
        email: session.email,
        tenantCode: session.tenantCode,
        userType: session.userType
      },
      {
        requestId: request.id
      }
    );
  });

  app.get("/auth/me", async (request, reply) => {
    const session = sessions.get(request.cookies.codexsun_session);

    if (!session) {
      return reply.code(401).send(
        fail(
          {
          code: "NOT_AUTHENTICATED",
          message: "No active session",
          details: {}
        },
          {
            requestId: request.id
          }
        )
      );
    }

    return ok(
      {
        email: session.email,
        tenantCode: session.tenantCode,
        userType: session.userType
      },
      {
        requestId: request.id
      }
    );
  });

  app.post("/auth/logout", async (request) => {
    sessions.destroy(request.cookies.codexsun_session);

    return ok(
      {
        loggedOut: true
      },
      {
        requestId: request.id
      }
    );
  });
}

type UserRow = {
  password_hash: string;
};

async function findUser(desk: "sa" | "admin" | "tenant", email: string): Promise<UserRow | undefined> {
  if (desk === "tenant") {
    const tenantDb = await createServerConnection(env.TENANT_TEST_DB_NAME);
    const [rows] = await tenantDb.execute<UserRow[]>(
      "SELECT * FROM tenant_users WHERE email = ? LIMIT 1",
      [email]
    );
    await tenantDb.end();
    return rows[0];
  }

  const tableName = desk === "sa" ? "super_admin_users" : "staff_users";
  const masterDb = await createServerConnection(env.DB_MASTER_NAME);
  const [rows] = await masterDb.execute<UserRow[]>(
    `SELECT * FROM ${tableName} WHERE email = ? LIMIT 1`,
    [email]
  );
  await masterDb.end();
  return rows[0];
}
