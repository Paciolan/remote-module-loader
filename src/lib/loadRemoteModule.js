import memoize from "./memoize";
import xmlHttpRequestFetcher from "./xmlHttpRequestFetcher";
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

export const createLoadRemoteModule = ({
  requires = defaultRequires,
  fetcher = defaultFetcher
} = {}) =>
  memoize(url =>
    fetcher(url).then(data => {
      const exports = {};
      const module = { exports };
      const func = new Function("require", "module", "exports", data);
      func(requires, module, exports);
      return module.exports;
    })
  );
