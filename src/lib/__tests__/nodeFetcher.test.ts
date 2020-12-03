import nodeFetcher from "../nodeFetcher";

// node: http and https mocks are duplicated
jest.mock("http", () => {
  return {
    get: jest.fn((url, callback) => {
      let onErrorCallback;

      const res = {
        on: jest.fn((eventName, fn) => {
          if (url === "http://invalid.url" && onErrorCallback) {
            onErrorCallback(new Error("500 Internal Server Error"));
            return res;
          }
          if (eventName === "data") {
            fn("SUCC");
            fn("ESS");
          } else if (eventName === "end") {
            fn();
          }
          return res;
        })
      };
      setTimeout(() => callback(res), 0);
      return {
        on: jest.fn((eventName, callback) => {
          if (eventName === "error") {
            onErrorCallback = callback;
          }
        })
      };
    })
  };
});

// node: http and https mocks are duplicated
jest.mock("https", () => {
  return {
    get: jest.fn((url, callback) => {
      let onErrorCallback;

      const res = {
        on: jest.fn((eventName, fn) => {
          if (url === "https://invalid.url" && onErrorCallback) {
            onErrorCallback(new Error("500 Internal Server Error"));
            return res;
          }
          if (eventName === "data") {
            // send SUCCESS as 2 packets
            fn("SUCC");
            fn("ESS");
          } else if (eventName === "end") {
            fn();
          }
          return res;
        })
      };
      setTimeout(() => callback(res), 0);
      return {
        on: jest.fn((eventName, callback) => {
          if (eventName === "error") {
            onErrorCallback = callback;
          }
        })
      };
    })
  };
});

describe("lib/nodeFetcher", () => {
  test("invalid URL rejects", () => {
    expect.assertions(1);
    const expected = new Error("URL must be a string.");
    const actual = nodeFetcher(null);
    return expect(actual).rejects.toStrictEqual(expected);
  });

  test("valid http request resolves", async () => {
    expect.assertions(1);
    const expected = "SUCCESS";
    const actual = await nodeFetcher("http://valid.url");
    expect(actual).toBe(expected);
  });

  test("valid https request resolves", async () => {
    expect.assertions(1);
    const expected = "SUCCESS";
    const actual = await nodeFetcher("https://valid.url");
    expect(actual).toBe(expected);
  });

  test("invalid request rejects", () => {
    expect.assertions(1);
    const expected = new Error("500 Internal Server Error");
    const actual = nodeFetcher("http://invalid.url");
    return expect(actual).rejects.toStrictEqual(expected);
  });
});
