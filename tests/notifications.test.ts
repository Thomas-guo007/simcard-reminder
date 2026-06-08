import { describe, expect, it } from "vitest";

// Test the utility functions from notifications module
// We test the pure logic functions without importing the full module (which needs RN)

function getDaysUntilDue(lastRechargeDate: string | Date, rechargeCycleDays: number): number {
  const lastRecharge = new Date(lastRechargeDate);
  const dueDate = new Date(lastRecharge);
  dueDate.setDate(dueDate.getDate() + rechargeCycleDays);

  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getCardStatus(daysUntilDue: number): "normal" | "warning" | "danger" {
  if (daysUntilDue <= 0) return "danger";
  if (daysUntilDue <= 7) return "warning";
  return "normal";
}

describe("Notification Utilities", () => {
  describe("getDaysUntilDue", () => {
    it("should return positive days for future due date", () => {
      const today = new Date();
      const lastRecharge = new Date(today);
      lastRecharge.setDate(lastRecharge.getDate() - 10);
      const result = getDaysUntilDue(lastRecharge.toISOString(), 30);
      expect(result).toBe(20);
    });

    it("should return 0 or negative for past due date", () => {
      const today = new Date();
      const lastRecharge = new Date(today);
      lastRecharge.setDate(lastRecharge.getDate() - 35);
      const result = getDaysUntilDue(lastRecharge.toISOString(), 30);
      expect(result).toBeLessThanOrEqual(0);
    });

    it("should handle string date input", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const lastRecharge = new Date(futureDate);
      lastRecharge.setDate(lastRecharge.getDate() - 30);
      const result = getDaysUntilDue(lastRecharge.toISOString().split("T")[0], 30);
      // Should be approximately 15 days
      expect(result).toBeGreaterThan(13);
      expect(result).toBeLessThan(17);
    });
  });

  describe("getCardStatus", () => {
    it("should return 'danger' for expired cards", () => {
      expect(getCardStatus(0)).toBe("danger");
      expect(getCardStatus(-5)).toBe("danger");
    });

    it("should return 'warning' for cards due within 7 days", () => {
      expect(getCardStatus(1)).toBe("warning");
      expect(getCardStatus(3)).toBe("warning");
      expect(getCardStatus(7)).toBe("warning");
    });

    it("should return 'normal' for cards with more than 7 days", () => {
      expect(getCardStatus(8)).toBe("normal");
      expect(getCardStatus(30)).toBe("normal");
      expect(getCardStatus(365)).toBe("normal");
    });
  });
});

describe("Country Data", () => {
  it("should have valid country entries", () => {
    // Inline test of country structure
    const testCountries = [
      { code: "CN", name: "中国", flag: "🇨🇳" },
      { code: "US", name: "美国", flag: "🇺🇸" },
    ];

    for (const country of testCountries) {
      expect(country.code).toHaveLength(2);
      expect(country.name.length).toBeGreaterThan(0);
      expect(country.flag.length).toBeGreaterThan(0);
    }
  });
});
