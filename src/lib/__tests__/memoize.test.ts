import { describe, test, mock } from "node:test";
import assert from "node:assert";
import memoize from "../memoize";

describe("lib/memoize", () => {
  test("memoizes same argument", () => {
    const upper = mock.fn((s: string) => s.toUpperCase());
    const memoized = memoize(upper);
    memoized("abc");
    memoized("abc");
    assert.strictEqual(upper.mock.callCount(), 1);
  });

  test("does not memoizes different argument", () => {
    const upper = mock.fn((s: string) => s.toUpperCase());
    const memoized = memoize(upper);
    memoized("abc");
    const actual = memoized("xyz");
    assert.strictEqual(actual, "XYZ");
  });
});
