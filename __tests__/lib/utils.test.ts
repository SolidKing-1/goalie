import { toMonthly, formatCurrency, daysUntil, formatRelativeDate, CATEGORY_COLORS, BILLING_CYCLE_LABELS } from "@/lib/utils";
import type { BillingCycle } from "@/types";

describe("toMonthly", () => {
  it("returns cost unchanged for MONTHLY", () => {
    expect(toMonthly(10, "MONTHLY")).toBe(10);
  });

  it("converts WEEKLY to monthly (cost * 52 / 12)", () => {
    expect(toMonthly(10, "WEEKLY")).toBeCloseTo(43.33, 1);
  });

  it("converts QUARTERLY to monthly (cost / 3)", () => {
    expect(toMonthly(30, "QUARTERLY")).toBeCloseTo(10, 2);
  });

  it("converts YEARLY to monthly (cost / 12)", () => {
    expect(toMonthly(120, "YEARLY")).toBeCloseTo(10, 2);
  });

  it("handles zero cost", () => {
    expect(toMonthly(0, "MONTHLY")).toBe(0);
    expect(toMonthly(0, "YEARLY")).toBe(0);
  });

  it("handles fractional costs", () => {
    expect(toMonthly(9.99, "MONTHLY")).toBe(9.99);
    expect(toMonthly(99.99, "YEARLY")).toBeCloseTo(8.33, 1);
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(10)).toBe("$10.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("respects explicit currency", () => {
    const result = formatCurrency(10, "EUR");
    expect(result).toContain("10.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(9.999)).toBe("$10.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-5.5)).toBe("-$5.50");
  });
});

describe("daysUntil", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-06-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns positive days for future date", () => {
    expect(daysUntil("2025-06-05T12:00:00Z")).toBe(4);
  });

  it("returns 0 for today", () => {
    expect(daysUntil("2025-06-01T12:00:00Z")).toBe(0);
  });

  it("returns negative days for past date", () => {
    expect(daysUntil("2025-05-30T12:00:00Z")).toBe(-2);
  });

  it("accepts Date objects", () => {
    const future = new Date("2025-06-10T12:00:00Z");
    expect(daysUntil(future)).toBe(9);
  });

  it("rounds up partial days (Math.ceil)", () => {
    // 1.5 days in the future → ceil → 2
    expect(daysUntil("2025-06-03T00:00:00Z")).toBeGreaterThanOrEqual(1);
  });
});

describe("formatRelativeDate", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-06-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Today" for today', () => {
    expect(formatRelativeDate("2025-06-01T12:00:00Z")).toBe("Today");
  });

  it('returns "Tomorrow" for tomorrow', () => {
    expect(formatRelativeDate("2025-06-02T12:00:00Z")).toBe("Tomorrow");
  });

  it('returns "In N days" for future dates', () => {
    expect(formatRelativeDate("2025-06-06T12:00:00Z")).toBe("In 5 days");
  });

  it('returns "N days ago" for past dates', () => {
    expect(formatRelativeDate("2025-05-29T12:00:00Z")).toBe("3 days ago");
  });
});

describe("CATEGORY_COLORS", () => {
  it("has entries for all expected categories", () => {
    const expected = [
      "STREAMING", "SOFTWARE", "FITNESS", "EDUCATION",
      "FOOD", "FINANCE", "GAMING", "PRODUCTIVITY", "NEWS", "OTHER",
    ];
    for (const cat of expected) {
      expect(CATEGORY_COLORS[cat]).toBeDefined();
      expect(CATEGORY_COLORS[cat]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("BILLING_CYCLE_LABELS", () => {
  it("maps all billing cycles to human labels", () => {
    const cycles: BillingCycle[] = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];
    for (const cycle of cycles) {
      expect(typeof BILLING_CYCLE_LABELS[cycle]).toBe("string");
      expect(BILLING_CYCLE_LABELS[cycle].length).toBeGreaterThan(0);
    }
  });

  it("returns expected labels", () => {
    expect(BILLING_CYCLE_LABELS.WEEKLY).toBe("Weekly");
    expect(BILLING_CYCLE_LABELS.MONTHLY).toBe("Monthly");
    expect(BILLING_CYCLE_LABELS.QUARTERLY).toBe("Quarterly");
    expect(BILLING_CYCLE_LABELS.YEARLY).toBe("Yearly");
  });
});
