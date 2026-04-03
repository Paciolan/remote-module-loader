import { describe, test } from "node:test";
import assert from "node:assert";
import { createRequires } from "../createRequires";

describe("lib/createRequires", () => {
  test("requires dependency", () => {
    const requires = createRequires({ abc: 123 });
    const actual = requires("abc");
    const expected = 123;
    assert.strictEqual(actual, expected);
  });

  test("missing dependency throws", () => {
    const requires = createRequires({ abc: 123 });
    const actual = () => requires("xyz");
    const expected = "Could not require 'xyz'. 'xyz' does not exist in dependencies."; // prettier-ignore
    assert.throws(actual, { message: expected });
  });

  test("missing dependency () throws", () => {
    const requires = createRequires();
    const actual = () => requires("xyz");
    const expected = "Could not require 'xyz'. 'xyz' does not exist in dependencies."; // prettier-ignore
    assert.throws(actual, { message: expected });
  });

  test("missing dependency (undefined) throws", () => {
    const requires = createRequires(undefined);
    const actual = () => requires("xyz");
    const expected = "Could not require 'xyz'. 'xyz' does not exist in dependencies."; // prettier-ignore
    assert.throws(actual, { message: expected });
  });

  test("missing dependency (null) throws", () => {
    const requires = createRequires(null as any);
    const actual = () => requires("xyz");
    const expected = "Could not require 'xyz'. 'xyz' does not exist in dependencies."; // prettier-ignore
    assert.throws(actual, { message: expected });
  });
});
