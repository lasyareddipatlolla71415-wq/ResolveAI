import { afterEach, describe, expect, it, vi } from "vitest";
import { connectDatabase, getDatabaseStatus, isMongoDbRequired } from "./database.js";

describe("database configuration", () => {
  afterEach(() => {
    delete process.env.MONGODB_REQUIRED;
    vi.restoreAllMocks();
  });

  it("reports development memory mode when MongoDB is not connected", () => {
    expect(getDatabaseStatus()).toMatchObject({
      connected: false,
      mode: "development-memory"
    });
  });

  it("allows explicit development memory mode when MongoDB is not required", async () => {
    process.env.MONGODB_REQUIRED = "false";
    await expect(connectDatabase(undefined)).resolves.toBeUndefined();
  });

  it("fails clearly when MongoDB is required and no URI is provided", async () => {
    process.env.MONGODB_REQUIRED = "true";
    expect(isMongoDbRequired()).toBe(true);
    await expect(connectDatabase(undefined)).rejects.toThrow("MONGODB_URI is required");
  });
});
