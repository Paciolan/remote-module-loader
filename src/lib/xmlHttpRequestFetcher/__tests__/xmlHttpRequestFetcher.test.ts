import { describe, test, before, after, mock } from "node:test";
import assert from "node:assert";
import xmlHttpRequestFetcher from "..";
import { OPENED, UNSENT, DONE } from "../readyState";
import { OK, InternalServerError } from "../../status";

describe("lib/xmlHttpRequestFetcher", () => {
  const originalXmlHttpRequest = (global as any).XMLHttpRequest;

  let mockXhrRequest: any;

  const mockXhr: any = {
    open: mock.fn((...args: any[]) => (mockXhrRequest = args)),
    send: mock.fn(() => {
      const isValid = mockXhrRequest[1] === "http://valid.url";

      mockXhr.readyState = OPENED;
      mockXhr.onreadystatechange();

      mockXhr.readyState = DONE;
      mockXhr.status = isValid ? OK : InternalServerError;
      mockXhr.responseText = isValid ? "SUCCESS" : "";
      mockXhr.statusText = isValid ? "OK" : "Internal Server Error";
      mockXhr.onreadystatechange();
    }),
    readyState: UNSENT
  };

  before(() => {
    (global as any).XMLHttpRequest = function () {
      return mockXhr;
    };
  });

  after(() => {
    (global as any).XMLHttpRequest = originalXmlHttpRequest;
  });

  test("valid request resolves", async () => {
    const expected = "SUCCESS";
    const actual = await xmlHttpRequestFetcher("http://valid.url");
    assert.strictEqual(actual, expected);
  });

  test("invalid request rejects", async () => {
    const expected = new Error(
      "HTTP Error Response: 500 Internal Server Error (http://invalid.url)"
    );
    await assert.rejects(
      xmlHttpRequestFetcher("http://invalid.url"),
      expected
    );
  });
});
