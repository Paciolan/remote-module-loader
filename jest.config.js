module.exports = {
  preset: "ts-jest",
  collectCoverageFrom: ["./src/**/*.ts"],
  coveragePathIgnorePatterns: ["./src/index.ts"],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
