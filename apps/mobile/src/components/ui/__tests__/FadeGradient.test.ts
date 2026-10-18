import { fadeGradient } from "../FadeGradient";

describe("fadeGradient", () => {
  it("should fade the color from full intensity to transparent, top to bottom", () => {
    const gradient = fadeGradient("#1DB954", 0.5);

    expect(gradient).toMatch(/^linear-gradient\(to bottom, /);
    expect(gradient).toContain("rgba(29, 185, 84, 0.500) 0.0%");
    expect(gradient).toContain("rgba(29, 185, 84, 0.000) 100.0%");
  });

  it("should fade upwards when reversed", () => {
    expect(fadeGradient("#000000", 1, true)).toMatch(/^linear-gradient\(to top, /);
  });
});
