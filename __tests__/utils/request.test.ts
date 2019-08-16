import {
  safeIntQueryParam,
  safeStringQueryParam
} from "../../src/utils/request";

test("safe-int", () => {
  expect(safeIntQueryParam(undefined, "limit")).toBe(0);
  expect(safeIntQueryParam(null, "limit", { defaultValue: 10 })).toBe(10);
  expect(safeIntQueryParam({ limit: "50" }, "limit", { maxValue: 20 })).toBe(
    20
  );
  expect(safeIntQueryParam({ limit: "-10" }, "limit", { minValue: 5 })).toBe(5);
});

test("safe-str", () => {
  expect(() => safeStringQueryParam(undefined, "name")).toThrowError(
    "No query parameter [name]"
  );
  expect(() =>
    safeStringQueryParam({ cursor: "something" }, "name")
  ).toThrowError("No query parameter [name]");
  expect(safeStringQueryParam({ name: "hello" }, "name")).toEqual("hello");
});
