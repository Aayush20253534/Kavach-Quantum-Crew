const checkDatabase = process.argv.includes("--database");

try {
  const { environment } = await import("../src/config/environment.js");

  const result = {
    valid: true,
    environment: environment.NODE_ENV,
    service: environment.APP_NAME,
    host: environment.HOST,
    port: environment.PORT,
    apiPrefix: environment.API_PREFIX,
    corsOrigins: environment.CORS_ORIGINS,
    databaseCheck: checkDatabase ? "pending" : "skipped",
  };

  if (checkDatabase) {
    const { database } = await import("../src/config/database.js");
    try {
      await database.connect();
      result.databaseCheck = { status: "up", ...(await database.ping()) };
    } finally {
      await database.disconnect();
    }
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
