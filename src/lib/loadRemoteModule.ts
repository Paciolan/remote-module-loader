import { Fetcher } from "../models";
import memoize from "./memoize";
import nodeFetcher from "./nodeFetcher";
import xmlHttpRequestFetcher from "./xmlHttpRequestFetcher/index";

/* istanbul ignore next - environment detection */
const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";

/* istanbul ignore next - difficult to test */
const defaultFetcher = isBrowser ? xmlHttpRequestFetcher : nodeFetcher;

const defaultRequires = (name: string) => {
  throw new Error(
    `Could not require '${name}'. The 'requires' function was not provided.`
  );
};

export interface CreateLoadRemoteModuleOptions {
  requires?: any;
  fetcher?: Fetcher;
  type?: "amd" | "cjs" | "umd";
}

interface LoadRemoteModule {
  (url: string): Promise<any>;
}

interface CreateLoadRemoteModule {
  (options?: CreateLoadRemoteModuleOptions): LoadRemoteModule;
}

export const createLoadRemoteModule: CreateLoadRemoteModule = ({
  requires,
  fetcher,
  type
} = {}) => {
  const _requires = requires || defaultRequires;
  const _fetcher = fetcher || defaultFetcher;

  return memoize((url: string) =>
    _fetcher(url).then(data => {
      const exports = {};
      const module = { exports };

      // "cjs" and "umd" keep `define` out of scope entirely. A UMD wrapper
      // then resolves through its CommonJS branch instead of registering via
      // `define`, which also fixes CJS bundles that embed a UMD dependency
      // (an injected `define` would otherwise hijack the dependency's exports;
      // GitHub issue #39). "umd" is handled identically to "cjs"; it exists as
      // a separate option only to read clearly at the call site.
      if (type === "cjs" || type === "umd") {
        const func = new Function("require", "module", "exports", data);
        func(_requires, module, exports);
        return module.exports;
      }

      const define: any = (...args: any[]) => {
        let factory: Function;
        let deps: string[];

        if (typeof args[args.length - 1] === "function") {
          factory = args.pop();
        } else {
          module.exports = args[args.length - 1];
          return;
        }

        deps = Array.isArray(args[args.length - 1]) ? args.pop() : ["require", "exports", "module"];

        const builtins: Record<string, any> = { exports, require: _requires, module };
        const resolved = deps.map(dep => builtins[dep] || _requires(dep));

        const result = factory(...resolved);
        if (result !== undefined) {
          module.exports = result;
        }
      };
      define.amd = {};

      const func = new Function("require", "module", "exports", "define", data);
      func(_requires, module, exports, define);
      return module.exports;
    })
  );
};
