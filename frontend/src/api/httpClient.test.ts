import { describe, expect, it } from "vitest";
import { httpClient } from "./httpClient";

describe("httpClient", () => {
  it("uses the versioned API base URL by default", () => {
    expect(httpClient.defaults.baseURL).toBe("/api/v1");
  });
});
