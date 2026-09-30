import { beforeEach, describe, expect, it } from "vitest";
import { getUserFromToken, loginUser, registerUser, resetDevelopmentAuthStore } from "./authService.js";

describe("authService development mode", () => {
  beforeEach(() => {
    resetDevelopmentAuthStore();
  });

  it("registers, logs in, and resolves the current user without a database connection", async () => {
    const registered = await registerUser({
      name: "Demo User",
      email: "Demo.User@example.com",
      password: "password123",
      role: "TECHNICIAN",
      department: "Support"
    });

    expect(registered.user.email).toBe("demo.user@example.com");
    expect(registered.user.role).toBe("TECHNICIAN");
    expect(registered.token).toBeTruthy();

    const loggedIn = await loginUser({
      email: "demo.user@example.com",
      password: "password123"
    });

    expect(loggedIn.user.id).toBe(registered.user.id);

    const currentUser = await getUserFromToken(loggedIn.token);
    expect(currentUser).toMatchObject({
      id: registered.user.id,
      email: "demo.user@example.com",
      department: "Support"
    });
  });
});
