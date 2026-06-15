import { describe, test, mock, beforeEach, after } from "node:test";
import assert from "node:assert";
import * as fs from "fs";

const invalidModule = "'";
const validModuleCjs = 'Object.assign(exports, { default: () => "SUCCESS!" })';
const validModuleAmd =
  'define(["exports"], function (exports) { Object.assign(exports, { default: function () { return "AMD SUCCESS!"; } }); })';
const namedExportsModule =
  'Object.assign(exports, {\n' +
  '  delete: () => "DELETED",\n' +
  '  create: () => "CREATED",\n' +
  '  update: () => "UPDATED",\n' +
  '  list: () => [],\n' +
  '})';
const umdModule = fs.readFileSync(
  __dirname + "/h-document-element.umd",
  "utf8"
);
const amdValueModule = 'define({ greeting: "HELLO" })';
const amdFactoryReturnModule =
  'define(function () { return { computed: "RETURNED" }; })';
const amdWithDepsModule =
  'define(["require"], function (req) { return { hasRequire: typeof req === "function" }; })';
const amdWithModuleDepModule =
  'define(["module"], function (mod) { mod.exports = { fromModule: true }; })';
const amdWithExternalDepModule =
  'define(["lodash"], function (lodash) { return { dep: lodash }; })';
const amdCjsWrapperModule =
  'define(function (require, exports, module) { exports.cjs = true; })';
const amdReturnOverridesExportsModule =
  'define(["exports"], function (exports) { exports.tmp = 1; return { real: true }; })';
const requiresModules =
  'Object.assign(exports, { default: () => require("test") })';
// Mimics a Vite 8 (Rolldown) CJS bundle embedding a UMD dependency: the
// bundler shadows module/exports with an internal shim but NOT define, so
// an injected define hijacks the dependency's exports (GitHub issue #39).
const cjsWithEmbeddedUmdModule =
  'var dep = (function () {\n' +
  '  var depModule = { exports: {} };\n' +
  '  (function (module, exports) {\n' +
  '    if (typeof define == "function" && typeof define.amd == "object" && define.amd) {\n' +
  '      define(function () { return { value: "AMD PATH" }; });\n' +
  '    } else {\n' +
  '      module.exports = { value: "CJS PATH" };\n' +
  '    }\n' +
  '  })(depModule, depModule.exports);\n' +
  '  return depModule.exports;\n' +
  '})();\n' +
  'module.exports = { default: function () { return dep.value; } };';

const mockFetcher = (url: string) =>
    url === "http://valid.url" ? Promise.resolve(validModuleCjs)
    : url === "http://requires.url" ? Promise.resolve(requiresModules)
    : url === "http://umdmodule.url" ? Promise.resolve(umdModule)
    : url === "http://amdmodule.url" ? Promise.resolve(validModuleAmd)
    : url === "http://amdvalue.url" ? Promise.resolve(amdValueModule)
    : url === "http://amdfactoryreturn.url" ? Promise.resolve(amdFactoryReturnModule)
    : url === "http://amdwithdeps.url" ? Promise.resolve(amdWithDepsModule)
    : url === "http://amdwithmoduledep.url" ? Promise.resolve(amdWithModuleDepModule)
    : url === "http://amdwithexternaldep.url" ? Promise.resolve(amdWithExternalDepModule)
    : url === "http://amdcjswrapper.url" ? Promise.resolve(amdCjsWrapperModule)
    : url === "http://amdreturnoverrides.url" ? Promise.resolve(amdReturnOverridesExportsModule)
    : url === "http://namedexports.url" ? Promise.resolve(namedExportsModule)
    : url === "http://cjsembeddedumd.url" ? Promise.resolve(cjsWithEmbeddedUmdModule)
    : Promise.resolve(invalidModule); // prettier-ignore

// Set window before loadRemoteModule.ts evaluates isBrowser so
// xmlHttpRequestFetcher is selected as the default fetcher.
(global as any).window = { document: {} };

const mockXhrFetcher = mock.fn((url: string) => mockFetcher(url));

mock.module("../xmlHttpRequestFetcher", {
  defaultExport: mockXhrFetcher
});

const { createLoadRemoteModule } = require("../loadRemoteModule");

describe("lib/loadRemoteModule", () => {
  after(() => {
    delete (global as any).window;
  });

  beforeEach(() => {
    mockXhrFetcher.mock.resetCalls();
  });

  test("invalid module rejects", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    await assert.rejects(loadRemoteModule("http://fake.url"), (err: any) => {
      assert.ok(err instanceof SyntaxError);
      return true;
    });
  });

  test("valid module resolves", async () => {
    const expected = ["default"];
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://valid.url");
    const actual = Object.keys(module);
    assert.deepStrictEqual(actual, expected);
  });

  test("valid module executes", async () => {
    const expected = "SUCCESS!";
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://valid.url");
    const actual = module.default();
    assert.strictEqual(actual, expected);
  });

  test("fetcher defaults to xmlHttpRequestFetcher", async () => {
    const expected = "http://valid.url";
    const loadRemoteModule = createLoadRemoteModule();
    await loadRemoteModule(expected);
    assert.deepStrictEqual(mockXhrFetcher.mock.calls[0].arguments, [expected]);
    assert.strictEqual(mockXhrFetcher.mock.callCount(), 1);
  });

  test("requires defaults to error", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://requires.url");
    const actual = () => module.default();
    assert.throws(actual, {
      message:
        "Could not require 'test'. The 'requires' function was not provided."
    });
  });

  test("umd load", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://umdmodule.url");
    assert.notStrictEqual(result.Fragment, undefined);
    assert.notStrictEqual(result.createElement, undefined);
    assert.notStrictEqual(result.h, undefined);
  });

  test("load functions using named exports", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    assert.notStrictEqual(result.create, undefined);
    assert.notStrictEqual(result.delete, undefined);
    assert.notStrictEqual(result.update, undefined);
    assert.notStrictEqual(result.list, undefined);
  });

  test("return string from create named exports function", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    const expected = "CREATED";
    const actual = result.create();
    assert.strictEqual(actual, expected);
  });

  test("return array from named exports function", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    const expected: any[] = [];
    const actual = result.list();
    assert.deepStrictEqual(actual, expected);
  });

  test("return string from delete named exports function", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    const expected = "DELETED";
    const actual = result.delete();
    assert.strictEqual(actual, expected);
  });

  test("return string from update named exports function", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    const expected = "UPDATED";
    const actual = result.update();
    assert.strictEqual(actual, expected);
  });

  test("amd module resolves", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://amdmodule.url");
    const actual = Object.keys(module);
    assert.deepStrictEqual(actual, ["default"]);
  });

  test("amd module executes", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://amdmodule.url");
    assert.strictEqual(module.default(), "AMD SUCCESS!");
  });

  test("amd define with value export (no factory)", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdvalue.url");
    assert.deepStrictEqual(result, { greeting: "HELLO" });
  });

  test("amd define with factory return value", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdfactoryreturn.url");
    assert.deepStrictEqual(result, { computed: "RETURNED" });
  });

  test("amd define resolves require dependency", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdwithdeps.url");
    assert.deepStrictEqual(result, { hasRequire: true });
  });

  test("amd define resolves module dependency", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdwithmoduledep.url");
    assert.deepStrictEqual(result, { fromModule: true });
  });

  test("amd define resolves external dependencies via requires", async () => {
    const fakeLodash = { map: () => "mapped" };
    const requires = (name: string) =>
      name === "lodash" ? fakeLodash : undefined;
    const loadRemoteModule = createLoadRemoteModule({
      fetcher: mockFetcher,
      requires
    });
    const result = await loadRemoteModule("http://amdwithexternaldep.url");
    assert.deepStrictEqual(result, { dep: fakeLodash });
  });

  test("amd factory without deps receives require, exports, module", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdcjswrapper.url");
    assert.deepStrictEqual(result, { cjs: true });
  });

  test("amd factory return value overrides exports", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdreturnoverrides.url");
    assert.deepStrictEqual(result, { real: true });
  });

  test("type:'amd' loads amd module", async () => {
    const loadRemoteModule = createLoadRemoteModule({
      fetcher: mockFetcher,
      type: "amd"
    });
    const module = await loadRemoteModule("http://amdmodule.url");
    assert.strictEqual(module.default(), "AMD SUCCESS!");
  });

  test("type:'cjs' loads plain cjs module", async () => {
    const loadRemoteModule = createLoadRemoteModule({
      fetcher: mockFetcher,
      type: "cjs"
    });
    const module = await loadRemoteModule("http://valid.url");
    assert.strictEqual(module.default(), "SUCCESS!");
  });

  test("type:'cjs' rejects modules that call define", async () => {
    const loadRemoteModule = createLoadRemoteModule({
      fetcher: mockFetcher,
      type: "cjs"
    });
    await assert.rejects(loadRemoteModule("http://amdmodule.url"), (err: any) => {
      assert.ok(err instanceof ReferenceError);
      return true;
    });
  });

  test("type:'cjs' evaluates embedded UMD dependency via CommonJS path", async () => {
    const loadRemoteModule = createLoadRemoteModule({
      fetcher: mockFetcher,
      type: "cjs"
    });
    const module = await loadRemoteModule("http://cjsembeddedumd.url");
    assert.strictEqual(module.default(), "CJS PATH");
  });

  test("type:'umd' loads umd module via its CommonJS branch", async () => {
    const loadRemoteModule = createLoadRemoteModule({
      fetcher: mockFetcher,
      type: "umd"
    });
    const result = await loadRemoteModule("http://umdmodule.url");
    assert.notStrictEqual(result.Fragment, undefined);
    assert.notStrictEqual(result.createElement, undefined);
    assert.notStrictEqual(result.h, undefined);
  });

  test("type:'umd' keeps define out of scope, same as cjs", async () => {
    const loadRemoteModule = createLoadRemoteModule({
      fetcher: mockFetcher,
      type: "umd"
    });
    await assert.rejects(loadRemoteModule("http://amdmodule.url"), (err: any) => {
      assert.ok(err instanceof ReferenceError);
      return true;
    });
  });
});
