// /budget command — show budget status to user

import type { BudgetManager } from "../../bom-optimizer/cost/budget-manager.js";
import type { AnalyticsAggregator } from "../../bom-optimizer/cost/analytics.js";
import { formatAnalyticsVi } from "../../bom-optimizer/cost/analytics.js";
import { formatBudgetStatusVi, COST_HELP_TEXT_VI } from "../../bom-optimizer/cost/messages-vi.js";

export interface BudgetCommandContext {
  budgetManager: BudgetManager;
  analytics: AnalyticsAggregator;
  sendMessage: (text: string, options?: { parseMode?: "Markdown" | "HTML" }) => Promise<void>;
}

export async function handleBudgetCommand(
  ctx: BudgetCommandContext,
  args: string[] = [],
): Promise<void> {
  const sub = args[0]?.toLowerCase();

  switch (sub) {
    case undefined:
    case "status":
      await showStatus(ctx);
      break;
    case "analytics":
    case "stats":
      await showAnalytics(ctx, args[1]);
      break;
    case "set":
      await setBudget(ctx, args.slice(1));
      break;
    case "help":
      await ctx.sendMessage(COST_HELP_TEXT_VI, { parseMode: "Markdown" });
      break;
    default:
      await ctx.sendMessage("Lệnh không hợp lệ. Dùng /budget help để xem hướng dẫn.");
  }
}

async function showStatus(ctx: BudgetCommandContext): Promise<void> {
  const status = ctx.budgetManager.getStatus();
  await ctx.sendMessage(formatBudgetStatusVi(status), { parseMode: "Markdown" });
}

async function showAnalytics(ctx: BudgetCommandContext, period?: string): Promise<void> {
  const valid = ["day", "week", "month"] as const;
  const p = (period?.toLowerCase() || "day") as (typeof valid)[number];

  if (!valid.includes(p)) {
    await ctx.sendMessage("Period không hợp lệ. Dùng: day, week, hoặc month");
    return;
  }

  const analytics = ctx.analytics.getAnalytics(p);
  await ctx.sendMessage(formatAnalyticsVi(analytics), { parseMode: "Markdown" });
}

async function setBudget(ctx: BudgetCommandContext, args: string[]): Promise<void> {
  if (args.length < 2) {
    await ctx.sendMessage(
      [
        "*Cách đặt ngân sách:*",
        "/budget set daily [số tiền]",
        "/budget set weekly [số tiền]",
        "/budget set monthly [số tiền]",
        "",
        "Ví dụ: /budget set daily 15",
      ].join("\n"),
      { parseMode: "Markdown" },
    );
    return;
  }

  const [period, amountStr] = args;
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    await ctx.sendMessage("Số tiền không hợp lệ. Phải là số dương.");
    return;
  }

  const validPeriods = ["daily", "weekly", "monthly"];
  if (!validPeriods.includes(period.toLowerCase())) {
    await ctx.sendMessage("Period không hợp lệ. Dùng: daily, weekly, hoặc monthly");
    return;
  }

  ctx.budgetManager.updateConfig({ [period.toLowerCase()]: amount });
  await ctx.sendMessage(`Đã đặt ngân sách ${period}: $${amount}`);
}

export function getQuickBudgetStatus(budgetManager: BudgetManager): string {
  const pct = Math.round(budgetManager.getStatus().daily.percentUsed);
  if (pct >= 95) return `Ngân sách: ${pct}%`;
  if (pct >= 80) return `Ngân sách: ${pct}%`;
  if (pct >= 50) return `Ngân sách: ${pct}%`;
  return "";
}
