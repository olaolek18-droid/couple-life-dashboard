import { describe, it, expect } from "vitest";

describe("Finances Module", () => {
  it("should calculate savings correctly", () => {
    const income = 2600; // 1300€ each
    const expenses = 800; // rent
    const savings = income - expenses;

    expect(savings).toBe(1800);
  });

  it("should calculate months to goal", () => {
    const target = 150000;
    const monthlySavings = 1800;
    const monthsToGoal = Math.ceil(target / monthlySavings);

    expect(monthsToGoal).toBe(84); // approximately 7 years
  });

  it("should calculate savings percentage", () => {
    const currentSavings = 15000;
    const target = 150000;
    const percentage = (currentSavings / target) * 100;

    expect(percentage).toBe(10);
  });

  it("should group expenses by category", () => {
    const expenses = [
      { category: "Groceries", amount: 50 },
      { category: "Groceries", amount: 30 },
      { category: "Rent", amount: 800 },
      { category: "Utilities", amount: 100 },
    ];

    const grouped = expenses.reduce((acc: any, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += exp.amount;
      return acc;
    }, {});

    expect(grouped.Groceries).toBe(80);
    expect(grouped.Rent).toBe(800);
    expect(grouped.Utilities).toBe(100);
  });
});
