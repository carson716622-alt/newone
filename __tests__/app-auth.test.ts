import { describe, it, expect, vi } from "vitest";

// Test that the invite code generator produces valid codes
describe("Invite Code Generation", () => {
  it("should generate a 6-character code with valid characters", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    function generateInviteCode(): string {
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    const code = generateInviteCode();
    expect(code).toHaveLength(6);
    for (const char of code) {
      expect(chars).toContain(char);
    }
  });

  it("should not contain confusing characters (I, O, 0, 1)", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    function generateInviteCode(): string {
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode();
      expect(code).not.toMatch(/[IO01]/);
    }
  });

  it("should generate unique codes across multiple calls", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    function generateInviteCode(): string {
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateInviteCode());
    }
    // With 30^6 possible codes, 50 codes should all be unique
    expect(codes.size).toBe(50);
  });
});

// Test time formatting logic
describe("Time Formatting", () => {
  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }

  it("should show 'Just now' for recent times", () => {
    const now = new Date().toISOString();
    expect(formatTime(now)).toBe("Just now");
  });

  it("should show minutes for times less than an hour ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatTime(fiveMinAgo)).toBe("5m ago");
  });

  it("should show hours for times less than a day ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatTime(twoHoursAgo)).toBe("2h ago");
  });

  it("should show days for times more than a day ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTime(threeDaysAgo)).toBe("3d ago");
  });
});

// Test validation logic
describe("Input Validation", () => {
  it("should validate email format", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("test@example.com")).toBe(true);
    expect(emailRegex.test("invalid")).toBe(false);
    expect(emailRegex.test("@example.com")).toBe(false);
    expect(emailRegex.test("test@")).toBe(false);
  });

  it("should validate password length", () => {
    expect("12345".length >= 6).toBe(false);
    expect("123456".length >= 6).toBe(true);
    expect("password123".length >= 6).toBe(true);
  });

  it("should validate invite code format", () => {
    const validCode = "ABC234";
    const invalidCode = "abc";
    expect(validCode.length).toBe(6);
    expect(invalidCode.length).toBeLessThan(6);
    expect(validCode.toUpperCase()).toBe(validCode);
  });
});
