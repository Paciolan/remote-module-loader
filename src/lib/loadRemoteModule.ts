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
}

interface LoadRemoteModule {
  (url: string): Promise<any>;
}

interface CreateLoadRemoteModule {
  (options?: CreateLoadRemoteModuleOptions): LoadRemoteModule;
}

export const createLoadRemoteModule: CreateLoadRemoteModule = ({
  requires,
  fetcher
} = {}) => {
  const _requires = requires || defaultRequires;
  const _fetcher = fetcher || defaultFetcher;

  return memoize((url: string) =>
    _fetcher(url).then(data => {
      const exports = {};
      const module = { exports };

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
