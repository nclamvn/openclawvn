import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBudgetCommand, getQuickBudgetStatus } from "../budget.js";
import { BudgetManager } from "../../../bom-optimizer/cost/budget-manager.js";
import { AnalyticsAggregator } from "../../../bom-optimizer/cost/analytics.js";

describe("handleBudgetCommand", () => {
  let budgetManager: BudgetManager;
  let analytics: AnalyticsAggregator;
  let sendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    budgetManager = new BudgetManager({ daily: 10, weekly: 50, monthly: 200 });
    analytics = new AnalyticsAggregator();
    sendMessage = vi.fn().mockResolvedValue(undefined);
  });

  it("shows budget status by default", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage });
    expect(sendMessage).toHaveBeenCalled();
    expect(sendMessage.mock.calls[0][0]).toContain("Tình trạng ngân sách");
  });

  it("shows budget status for 'status' subcommand", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["status"]);
    expect(sendMessage.mock.calls[0][0]).toContain("Tình trạng ngân sách");
  });

  it("shows analytics for 'stats' subcommand", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["stats", "day"]);
    expect(sendMessage.mock.calls[0][0]).toContain("Thống kê");
  });

  it("shows analytics for 'analytics' subcommand", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["analytics"]);
    expect(sendMessage.mock.calls[0][0]).toContain("Thống kê");
  });

  it("rejects invalid analytics period", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["stats", "year"]);
    expect(sendMessage.mock.calls[0][0]).toContain("không hợp lệ");
  });

  it("sets daily budget", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["set", "daily", "15"]);
    expect(budgetManager.getConfig().daily).toBe(15);
    expect(sendMessage.mock.calls[0][0]).toContain("Đã đặt ngân sách");
  });

  it("shows set help when missing arguments", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["set"]);
    expect(sendMessage.mock.calls[0][0]).toContain("Cách đặt ngân sách");
  });

  it("rejects invalid amount", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["set", "daily", "abc"]);
    expect(sendMessage.mock.calls[0][0]).toContain("không hợp lệ");
  });

  it("rejects invalid period for set", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["set", "yearly", "100"]);
    expect(sendMessage.mock.calls[0][0]).toContain("không hợp lệ");
  });

  it("shows help for 'help' subcommand", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["help"]);
    expect(sendMessage.mock.calls[0][0]).toContain("Quản lý chi phí");
  });

  it("shows error for unknown subcommand", async () => {
    await handleBudgetCommand({ budgetManager, analytics, sendMessage }, ["unknown"]);
    expect(sendMessage.mock.calls[0][0]).toContain("không hợp lệ");
  });
});

describe("getQuickBudgetStatus", () => {
  it("returns empty for low usage", () => {
    const bm = new BudgetManager({ daily: 10 });
    expect(getQuickBudgetStatus(bm)).toBe("");
  });

  it("returns status for 50%+ usage", () => {
    const bm = new BudgetManager({ daily: 10 });
    bm.recordSpending(5.5);
    expect(getQuickBudgetStatus(bm)).toContain("Ngân sách");
    expect(getQuickBudgetStatus(bm)).toContain("55%");
  });

  it("returns status for 80%+ usage", () => {
    const bm = new BudgetManager({ daily: 10 });
    bm.recordSpending(8.5);
    expect(getQuickBudgetStatus(bm)).toContain("85%");
  });

  it("returns status for 95%+ usage", () => {
    const bm = new BudgetManager({ daily: 10 });
    bm.recordSpending(9.6);
    expect(getQuickBudgetStatus(bm)).toContain("96%");
  });
});
