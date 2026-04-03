import { describe, test, mock } from "node:test";
import assert from "node:assert";
import { OK, InternalServerError } from "../status";

// node: http and https mocks are duplicated
const httpGet = mock.fn((url: string, callback: Function) => {
  let onErrorCallback: Function | undefined;
  const isPrematureClose = url === "http://premature-close.url";

  const res: any = {
    on(eventName: string, fn: Function) {
      if (url === "http://invalid.url" && onErrorCallback) {
        const error = new Error("500 Internal Server Error");
        (error as any).response = res;
        onErrorCallback(error);
        return res;
      }
      if (eventName === "data") {
        if (isPrematureClose) {
          fn("PAR");
        } else {
          fn("SUCC");
          fn("ESS");
        }
      } else if (eventName === "end") {
        if (!isPrematureClose) {
          fn();
        }
      } else if (eventName === "close") {
        fn();
      }

      return res;
    },
    statusCode: url === "http://invalid.url" ? InternalServerError : OK,
    statusMessage:
      url === "http://invalid.url" ? "Internal Server Error" : "OK",
    complete: !isPrematureClose
  };
  setTimeout(() => callback(res), 0);
  return {
    on(eventName: string, cb: Function) {
      if (eventName === "error") {
        onErrorCallback = cb;
      }
    }
  };
});

// node: http and https mocks are duplicated
const httpsGet = mock.fn((url: string, callback: Function) => {
  let onErrorCallback: Function | undefined;

  const res: any = {
    on(eventName: string, fn: Function) {
      if (url === "https://invalid.url" && onErrorCallback) {
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
    },
    statusCode: url === "http://invalid.url" ? InternalServerError : OK,
    statusMessage:
      url === "http://invalid.url" ? "Internal Server Error" : "OK"
  };
  setTimeout(() => callback(res), 0);
  return {
    on(eventName: string, cb: Function) {
      if (eventName === "error") {
        onErrorCallback = cb;
      }
    }
  };
});

mock.module("http", { namedExports: { get: httpGet } });
mock.module("https", { namedExports: { get: httpsGet } });

const nodeFetcher = require("../nodeFetcher").default;

describe("lib/nodeFetcher", () => {
  test("invalid URL rejects", async () => {
    const expected = new Error("URL must be a string.");
    await assert.rejects(nodeFetcher(null as any), expected);
  });

  test("valid http request resolves", async () => {
    const expected = "SUCCESS";
    const actual = await nodeFetcher("http://valid.url");
    assert.strictEqual(actual, expected);
  });

  test("valid https request resolves", async () => {
    const expected = "SUCCESS";
    const actual = await nodeFetcher("https://valid.url");
    assert.strictEqual(actual, expected);
  });

  test("invalid request rejects", async () => {
    const expected = new Error(
      "HTTP Error Response: 500 Internal Server Error (http://invalid.url)"
    );
    await assert.rejects(nodeFetcher("http://invalid.url"), expected);
  });

  test("premature close rejects", async () => {
    const expected = new Error(
      "Connection closed before response was complete (http://premature-close.url)"
    );
    await assert.rejects(nodeFetcher("http://premature-close.url"), expected);
  });
});
