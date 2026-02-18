// Vietnamese cost messages for user-facing display

import type { CostEstimate, BudgetStatus, SubscriptionAdvice, CostComparison } from "./types.js";

// ── Cost estimation ─────────────────────────────────────────

function tierNameVi(tier: string): string {
  if (tier === "haiku") return "Haiku - Nhanh";
  if (tier === "sonnet") return "Sonnet - Cân bằng";
  if (tier === "opus") return "Opus - Mạnh nhất";
  return tier;
}

export function formatCostEstimateVi(estimate: CostEstimate): string {
  const cost = estimate.estimatedCost;
  const tier = tierNameVi(estimate.tier);
  if (cost < 0.001) return `Chi phí ước tính: <$0.001 (${tier})`;
  if (cost < 0.01) return `Chi phí ước tính: ~$${cost.toFixed(4)} (${tier})`;
  if (cost < 0.1) return `Chi phí ước tính: ~$${cost.toFixed(3)} (${tier})`;
  return `Chi phí ước tính: ~$${cost.toFixed(2)} (${tier})`;
}

export function formatPreExecutionVi(estimate: CostEstimate): string {
  return `${formatCostEstimateVi(estimate)}\n\nTiếp tục? (Trả lời "ok" hoặc gửi tin nhắn mới)`;
}

export function formatPostExecutionVi(actualCost: number, _model: string): string {
  if (actualCost < 0.001) return "Hoàn thành | Chi phí: <$0.001";
  return `Hoàn thành | Chi phí: $${actualCost.toFixed(4)}`;
}

// ── Cost comparison ─────────────────────────────────────────

export function formatComparisonVi(comparison: CostComparison): string {
  const lines: string[] = [];
  lines.push("*So sánh chi phí*");
  lines.push(
    `Lựa chọn hiện tại: ${comparison.current.tier} - $${comparison.current.estimatedCost.toFixed(4)}`,
  );
  lines.push("");
  lines.push("Các lựa chọn khác:");

  for (const alt of comparison.alternatives) {
    const sign = alt.costDifference >= 0 ? "+" : "";
    const marker = alt.recommended ? "[rec]" : "-";
    lines.push(
      `  ${marker} ${tierNameVi(alt.tier)}: $${alt.estimatedCost.toFixed(4)} (${sign}${alt.costDifferencePercent}%)`,
    );
  }

  if (comparison.recommendation) {
    lines.push("");
    lines.push(comparison.recommendation);
  }

  return lines.join("\n");
}

// ── Budget status ───────────────────────────────────────────

function progressBar(percent: number): string {
  const filled = Math.min(10, Math.round(percent / 10));
  const empty = 10 - filled;
  const ch = percent >= 80 ? "X" : percent >= 50 ? "=" : "#";
  return `[${ch.repeat(filled)}${".".repeat(empty)}]`;
}

export function formatBudgetStatusVi(status: BudgetStatus): string {
  const lines: string[] = [];
  lines.push("*Tình trạng ngân sách*");
  lines.push("");

  for (const [label, key] of [
    ["Hôm nay", "daily"],
    ["Tuần này", "weekly"],
    ["Tháng này", "monthly"],
  ] as const) {
    const s = status[key];
    const pct = Math.round(s.percentUsed);
    lines.push(`*${label}:* $${s.spent.toFixed(2)} / $${s.limit}`);
    lines.push(`${progressBar(pct)} ${pct}%`);
    lines.push("");
  }

  const anyHigh = [status.daily, status.weekly, status.monthly].some((s) => s.percentUsed >= 80);
  if (anyHigh) {
    lines.push("Ngân sách sắp hết. Hãy cân nhắc trước khi gửi request lớn.");
  }

  return lines.join("\n");
}

// ── Budget warnings ─────────────────────────────────────────

export function formatBudgetWarningVi(
  period: "daily" | "weekly" | "monthly",
  percentUsed: number,
  remaining: number,
): string {
  const periodVi = period === "daily" ? "hôm nay" : period === "weekly" ? "tuần này" : "tháng này";

  if (percentUsed >= 95) {
    return `Cảnh báo: Đã dùng ${Math.round(percentUsed)}% ngân sách ${periodVi}. Chỉ còn $${remaining.toFixed(2)}.`;
  }
  if (percentUsed >= 80) {
    return `Lưu ý: Đã dùng ${Math.round(percentUsed)}% ngân sách ${periodVi}. Còn $${remaining.toFixed(2)}.`;
  }
  return `Đã dùng ${Math.round(percentUsed)}% ngân sách ${periodVi}.`;
}

export function formatBudgetExceededVi(reason: string): string {
  return `Không thể thực hiện\n\n${reason}\n\nHãy đợi ngân sách reset hoặc điều chỉnh giới hạn.`;
}

// ── Subscription advice ─────────────────────────────────────

export function formatSubscriptionAdviceVi(advice: SubscriptionAdvice): string {
  if (!advice.shouldRecommend) return "";

  const planName =
    advice.plan === "pro"
      ? "Claude Pro ($20/tháng)"
      : advice.plan === "max5x"
        ? "Claude Max 5x ($100/tháng)"
        : "Claude Max 20x ($200/tháng)";

  return [
    "*Gợi ý tiết kiệm*",
    "",
    `Dựa trên cách dùng của bạn (~$${advice.estimatedApiCost.toFixed(0)}/tháng qua API), đăng ký ${planName} có thể tiết kiệm ~$${advice.savings.toFixed(0)}/tháng (${advice.savingsPercent}%).`,
  ].join("\n");
}

// ── High cost warning ───────────────────────────────────────

export function formatHighCostWarningVi(estimatedCost: number, threshold: number): string {
  return `Request chi phí cao\n\nƯớc tính: $${estimatedCost.toFixed(3)}\nNgưỡng cảnh báo: $${threshold.toFixed(2)}\n\nBạn có muốn tiếp tục?`;
}

// ── Help text ───────────────────────────────────────────────

export const COST_HELP_TEXT_VI = `*Quản lý chi phí Bờm*

*Lệnh có sẵn:*
/budget - Xem tình trạng ngân sách
/budget stats day - Xem thống kê hôm nay
/budget set daily 15 - Đặt ngân sách

*Model và chi phí:*
- Haiku: ~$0.001/request (nhanh, đơn giản)
- Sonnet: ~$0.01/request (cân bằng)
- Opus: ~$0.05/request (phức tạp)

*Mẹo tiết kiệm:*
- Dùng Haiku cho câu hỏi đơn giản
- Nếu dùng nhiều (>$50/tháng), cân nhắc subscription`;
