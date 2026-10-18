import { AxiosError, type AxiosResponse } from "axios";

import { coverPalette } from "@/theme/colors";
import { coverColor, errorMessage, formatDuration, greeting, initial } from "../format";

describe("coverColor", () => {
  it("should always give the same palette color for the same name", () => {
    expect(coverColor("Friday party")).toBe(coverColor("Friday party"));
    expect(coverPalette).toContain(coverColor("Friday party"));
  });
});

describe("initial", () => {
  it("should return the first letter in upper case", () => {
    expect(initial("  alice")).toBe("A");
  });

  it("should fall back to a question mark without a name", () => {
    expect(initial(undefined)).toBe("?");
    expect(initial("   ")).toBe("?");
  });
});

describe("greeting", () => {
  it("should depend on the time of day", () => {
    expect(greeting(new Date(2026, 0, 1, 9))).toBe("Good morning");
    expect(greeting(new Date(2026, 0, 1, 15))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 0, 1, 21))).toBe("Good evening");
  });
});

describe("formatDuration", () => {
  it("should format milliseconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(200_999)).toBe("3:20");
  });

  it("should never show negative times", () => {
    expect(formatDuration(-5000)).toBe("0:00");
  });
});

describe("errorMessage", () => {
  const axiosError = (data: unknown) => {
    const error = new AxiosError("Request failed");
    error.response = { data } as AxiosResponse;
    return error;
  };

  it("should use the message sent by the API", () => {
    expect(errorMessage(axiosError({ message: "Room not found" }), "Fallback")).toBe(
      "Room not found",
    );
  });

  it("should use the fallback when the API sent no message", () => {
    expect(errorMessage(axiosError({}), "Fallback")).toBe("Fallback");
  });

  it("should use the fallback for errors that are not from the API", () => {
    expect(errorMessage(new Error("boom"), "Fallback")).toBe("Fallback");
  });
});
