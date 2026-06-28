import type { ConnectionOptions } from "mysql2/promise";
import mysql from "mysql2/promise";
import mariadb, { type ConnectionConfig } from "mariadb";

export type DatabaseTarget = {
  database?: string;
};

export type DatabaseConfig = {
  driver?: "mariadb" | "mysql2";
  host: string;
  password: string;
  port: number;
  user: string;
};

export type CompatibleDbConnection = {
  end(): Promise<void>;
  execute<TResult = unknown>(sql: string, values?: unknown[]): Promise<[TResult, unknown]>;
};

export type DatabaseConnector = {
  connect(target?: DatabaseTarget): Promise<CompatibleDbConnection>;
};

export function createMysqlConnector(config: DatabaseConfig): DatabaseConnector {
  return createDatabaseConnector({
    ...config,
    driver: "mysql2"
  });
}

export function createDatabaseConnector(config: DatabaseConfig): DatabaseConnector {
  if (config.driver === "mysql2") {
    return createMysql2Connector(config);
  }

  return createMariaDbConnector(config);
}

function createMysql2Connector(config: DatabaseConfig): DatabaseConnector {
  return {
    async connect(target) {
      const options: ConnectionOptions = {
        host: config.host,
        multipleStatements: false,
        password: config.password,
        port: config.port,
        user: config.user
      };

      if (target?.database) {
        options.database = target.database;
      }

      const connection = await mysql.createConnection(options);
      return connection as unknown as CompatibleDbConnection;
    }
  };
}

function createMariaDbConnector(config: DatabaseConfig): DatabaseConnector {
  return {
    async connect(target) {
      const options: ConnectionConfig = {
        allowPublicKeyRetrieval: true,
        host: config.host,
        password: config.password,
        port: config.port,
        user: config.user
      };

      if (target?.database) {
        options.database = target.database;
      }

      const connection = await mariadb.createConnection(options);

      return {
        async end() {
          await connection.end();
        },
        async execute<TResult = unknown>(sql: string, values?: unknown[]) {
          const result = await connection.query(sql, values);
          return [result as TResult, undefined];
        }
      };
    }
  };
}
