import { it, expect } from "vitest";
import { clockShift } from "./clockGuard";
it("accepts a normal long interruption but rejects clock jumps", () => {
  expect(clockShift(600000, 600000)).toBe(false);
  expect(clockShift(200, 200)).toBe(false);
  expect(clockShift(-1000, 200)).toBe(true);
  expect(clockShift(600000, 200)).toBe(true);
});
