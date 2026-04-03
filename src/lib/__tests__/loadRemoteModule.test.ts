import * as fs from "fs";
import { createLoadRemoteModule } from "../loadRemoteModule";
import xmlHttpRequestFetcher from "../xmlHttpRequestFetcher";

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
    : Promise.resolve(invalidModule); // prettier-ignore

jest.mock("../xmlHttpRequestFetcher", () => {
  // Set window before loadRemoteModule.ts evaluates isBrowser so
  // xmlHttpRequestFetcher is selected as the default fetcher.
  (global as any).window = { document: {} };
  return { __esModule: true, default: jest.fn().mockImplementation((url: string) => mockFetcher(url)) };
});

describe("lib/loadRemoteModule", () => {
  afterAll(() => {
    delete (global as any).window;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("invalid module rejects", () => {
    const expected = SyntaxError("Invalid or unexpected token");
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const actual = loadRemoteModule("http://fake.url");
    return expect(actual).rejects.toMatchObject(expected);
  });

  test("valid module resolves", async () => {
    const expected = ["default"];
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://valid.url");
    const actual = Object.keys(module);
    return expect(actual).toMatchObject(expected);
  });

  test("valid module executes", async () => {
    const expected = "SUCCESS!";
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://valid.url");
    const actual = module.default();
    return expect(actual).toBe(expected);
  });

  test("fetcher defaults to xmlHttpRequestFetcher", async () => {
    const expected = "http://valid.url";
    const loadRemoteModule = createLoadRemoteModule();
    await loadRemoteModule(expected);
    expect(xmlHttpRequestFetcher).toHaveBeenCalledWith(expected);
    expect(xmlHttpRequestFetcher).toHaveBeenCalledTimes(1);
  });

  test("requires defaults to error", async () => {
    const expected = Error(
      "Could not require 'test'. The 'requires' function was not provided."
    );
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://requires.url");
    const actual = () => module.default();
    expect(actual).toThrow(expected);
  });

  test("umd load", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://umdmodule.url");
    expect(result.Fragment).toBeDefined();
    expect(result.createElement).toBeDefined();
    expect(result.h).toBeDefined();
  });

  test("load functions using named exports", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    expect(result.create).toBeDefined();
    expect(result.delete).toBeDefined();
    expect(result.update).toBeDefined();
    expect(result.list).toBeDefined();
  });

  test("return string from create named exports function", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    const expected = "CREATED";
    const actual = result.create();
    expect(actual).toBe(expected);
  });

  test("return array from named exports function", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    const expected: any[] = [];
    const actual = result.list();
    expect(actual).toMatchObject(expected);
  });

  test("return string from delete named exports function", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    const expected = "DELETED";
    const actual = result.delete();
    expect(actual).toBe(expected);
  });

  test("return string from update named exports function", async () => {
    const remoteModuleLoader = createLoadRemoteModule();
    const result = await remoteModuleLoader("http://namedexports.url");
    const expected = "UPDATED";
    const actual = result.update();
    expect(actual).toBe(expected);
  });

  test("amd module resolves", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://amdmodule.url");
    const actual = Object.keys(module);
    expect(actual).toMatchObject(["default"]);
  });

  test("amd module executes", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const module = await loadRemoteModule("http://amdmodule.url");
    expect(module.default()).toBe("AMD SUCCESS!");
  });

  test("amd define with value export (no factory)", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdvalue.url");
    expect(result).toEqual({ greeting: "HELLO" });
  });

  test("amd define with factory return value", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdfactoryreturn.url");
    expect(result).toEqual({ computed: "RETURNED" });
  });

  test("amd define resolves require dependency", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdwithdeps.url");
    expect(result).toEqual({ hasRequire: true });
  });

  test("amd define resolves module dependency", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdwithmoduledep.url");
    expect(result).toEqual({ fromModule: true });
  });

  test("amd define resolves external dependencies via requires", async () => {
    const fakeLodash = { map: () => "mapped" };
    const requires = (name: string) => (name === "lodash" ? fakeLodash : undefined);
    const loadRemoteModule = createLoadRemoteModule({
      fetcher: mockFetcher,
      requires
    });
    const result = await loadRemoteModule("http://amdwithexternaldep.url");
    expect(result).toEqual({ dep: fakeLodash });
  });

  test("amd factory without deps receives require, exports, module", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdcjswrapper.url");
    expect(result).toEqual({ cjs: true });
  });

  test("amd factory return value overrides exports", async () => {
    const loadRemoteModule = createLoadRemoteModule({ fetcher: mockFetcher });
    const result = await loadRemoteModule("http://amdreturnoverrides.url");
    expect(result).toEqual({ real: true });
  });
});
