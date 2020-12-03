import memoize from "./memoize";
import xmlHttpRequestFetcher from "./xmlHttpRequestFetcher/index";
import nodeFetcher from "./nodeFetcher";

const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";

/* istanbul ignore next - difficult to test */
const defaultFetcher = isBrowser ? xmlHttpRequestFetcher : nodeFetcher;

const defaultRequires = name => {
  throw new Error(
    `Could not require '${name}'. The 'requires' function was not provided.`
  );
};

interface CreateLoadRemoteModuleOptions {
  requires: any;
  fetcher: any;
}

interface LoadRemoteModule {
  (url: string): Promise<any>;
}

interface CreateLoadRemoteModule {
  (CreateLoadRemoteModuleOptions?): LoadRemoteModule;
}

export const createLoadRemoteModule: CreateLoadRemoteModule = ({
  requires,
  fetcher
} = {}) => {
  const _requires = requires || defaultRequires;
  const _fetcher = fetcher || defaultFetcher;

  return memoize(url =>
    _fetcher(url).then(data => {
      const exports = {};
      const module = { exports };
      const func = new Function("require", "module", "exports", data);
      func(_requires, module, exports);
      return module.exports;
    })
  );
};
