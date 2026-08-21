/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup/testEnvironment.js"],
  testMatch: [
    "<rootDir>/tests/phase0/**/*.test.js",
    "<rootDir>/tests/phase1/**/*.test.js",
  ],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "src/app.js",
    "src/server.js",
    "src/common/errors/ApiError.js",
    "src/common/responses/ApiResponse.js",
    "src/common/utils/asyncHandler.js",
    "src/config/{cors,database,environment,logger,security}.js",
    "src/middleware/{errorHandler,notFound,rateLimiter,requestId}.middleware.js",
    "src/modules/health/{health.controller,health.repository,health.routes,health.service}.js",
    "src/realtime/socketServer.js",
    "src/routes/index.js",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },
  detectOpenHandles: true,
  forceExit: false,
  verbose: true,
};
