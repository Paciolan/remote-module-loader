import eslintPluginPrettier from "eslint-plugin-prettier/recommended";

export default [
  {
    ignores: ["dist/"]
  },
  eslintPluginPrettier,
  {
    languageOptions: {
      ecmaVersion: 2019,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        XMLHttpRequest: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        module: "readonly",
        exports: "readonly",
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        jest: "readonly",
        global: "readonly"
      }
    },
    rules: {
      "prettier/prettier": "error",
      "no-unused-vars": "error",
      "no-undef": "error"
    }
  }
];
