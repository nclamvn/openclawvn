// Cost-aware message handler for Telegram

import type {
  RequestWrapper,
  PreExecutionResult,
} from "../../bom-optimizer/integration/request-wrapper.js";
import type { BudgetManager } from "../../bom-optimizer/cost/budget-manager.js";
import {
  formatComparisonVi,
  formatSubscriptionAdviceVi,
} from "../../bom-optimizer/cost/messages-vi.js";
import { analyzeForSubscription } from "../../bom-optimizer/cost/subscription-advisor.js";
import { getQuickBudgetStatus } from "../commands/budget.js";

export interface TelegramContext {
  chatId: string | number;
  userId: string;
  messageText: string;
  replyTo?: number;
}

export interface CostAwareHandlerOptions {
  requestWrapper: RequestWrapper;
  budgetManager: BudgetManager;
  sendMessage: (
    chatId: string | number,
    text: string,
    options?: { parseMode?: string },
  ) => Promise<{ messageId: number }>;
  processMessage: (ctx: TelegramContext) => Promise<{
    response: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
  }>;
}

interface PendingConfirmation {
  ctx: TelegramContext;
  preCheck: PreExecutionResult;
  expiresAt: number;
}

const CONFIRM_WORDS = new Set(["ok", "yes", "có", "đồng ý", "tiếp tục", "proceed", "y"]);
const CANCEL_WORDS = new Set(["no", "không", "hủy", "cancel", "stop", "n"]);

export class CostAwareHandler {
  private options: CostAwareHandlerOptions;
  private pending = new Map<string, PendingConfirmation>();

  constructor(options: CostAwareHandlerOptions) {
    this.options = options;
  }

  async handleMessage(ctx: TelegramContext): Promise<void> {
    const { requestWrapper, sendMessage } = this.options;
    const key = `${ctx.chatId}:${ctx.userId}`;
    const pendingEntry = this.pending.get(key);

    // Handle pending confirmation
    if (pendingEntry && pendingEntry.expiresAt > Date.now()) {
      const word = ctx.messageText.toLowerCase().trim();
      if (CONFIRM_WORDS.has(word)) {
        this.pending.delete(key);
        await this.executeWithTracking(pendingEntry.ctx);
        return;
      }
      if (CANCEL_WORDS.has(word)) {
        this.pending.delete(key);
        await sendMessage(ctx.chatId, "Đã hủy request.");
        return;
      }
    }
    // Expired or not a confirm/cancel — treat as new request
    this.pending.delete(key);

    // Pre-execution check
    const preCheck = requestWrapper.checkBeforeExecution({
      model: "sonnet",
      inputText: ctx.messageText,
      userId: ctx.userId,
    });

    if (!preCheck.allowed) {
      await sendMessage(
        ctx.chatId,
        preCheck.messages.blocked || "Request bị chặn do vượt ngân sách.",
      );
      return;
    }

    if (preCheck.requiresConfirmation) {
      await this.requestConfirmation(ctx, preCheck);
      return;
    }

    await this.executeWithTracking(ctx);
  }

  private async requestConfirmation(
    ctx: TelegramContext,
    preCheck: PreExecutionResult,
  ): Promise<void> {
    const { sendMessage } = this.options;

    const lines: string[] = [preCheck.messages.costEstimate];

    if (preCheck.messages.highCostWarning) {
      lines.push("", preCheck.messages.highCostWarning);
    }
    if (preCheck.messages.budgetWarning) {
      lines.push("", preCheck.messages.budgetWarning);
    }
    if (preCheck.estimate.estimatedCost >= 0.05) {
      lines.push("", formatComparisonVi(preCheck.comparison));
    }

    lines.push("", 'Trả lời "ok" để tiếp tục hoặc "hủy" để dừng.');

    await sendMessage(ctx.chatId, lines.join("\n"), { parseMode: "Markdown" });

    const key = `${ctx.chatId}:${ctx.userId}`;
    this.pending.set(key, {
      ctx,
      preCheck,
      expiresAt: Date.now() + 5 * 60_000,
    });
  }

  private async executeWithTracking(ctx: TelegramContext): Promise<void> {
    const { requestWrapper, budgetManager, sendMessage, processMessage } = this.options;

    try {
      const result = await processMessage(ctx);

      const costResult = requestWrapper.recordAfterExecution(
        { model: result.model, inputText: ctx.messageText, userId: ctx.userId },
        result.inputTokens,
        result.outputTokens,
      );

      const quickStatus = getQuickBudgetStatus(budgetManager);
      const footer = quickStatus
        ? `\n\n---\n${costResult.message} | ${quickStatus}`
        : `\n\n---\n${costResult.message}`;

      await sendMessage(ctx.chatId, result.response + footer);

      // Subscription advice for heavy users
      const monthlySpent = costResult.budgetStatus.monthly.spent;
      if (monthlySpent > 30) {
        const advice = analyzeForSubscription(monthlySpent);
        if (advice.shouldRecommend) {
          const msg = formatSubscriptionAdviceVi(advice);
          if (msg) {
            await sendMessage(ctx.chatId, msg, { parseMode: "Markdown" });
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      await sendMessage(ctx.chatId, `Lỗi: ${msg}`);
    }
  }

  clearExpiredPending(): void {
    const now = Date.now();
    for (const [key, p] of this.pending) {
      if (p.expiresAt < now) this.pending.delete(key);
    }
  }
}
