import { expect, it } from "vitest";
import { holdProgress } from "../../src/hold";

it("Shows progress towards a two-second hold without exceeding its bounds", () => {
  expect(holdProgress(-10)).toBe(0);
  expect(holdProgress(0)).toBe(0);
  expect(holdProgress(1000)).toBe(0.5);
  expect(holdProgress(1999)).toBeLessThan(1);
  expect(holdProgress(2000)).toBe(1);
  expect(holdProgress(3000)).toBe(1);
});
