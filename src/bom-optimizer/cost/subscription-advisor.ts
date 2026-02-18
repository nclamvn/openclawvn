// Subscription advisor — recommend subscription when cheaper than API

import type { SubscriptionAdvice, SubscriptionComparison } from "./types.js";
import { SUBSCRIPTION_PRICING } from "./pricing.js";

const THRESHOLDS = {
  proThreshold: 15,
  max5xThreshold: 70,
  max20xThreshold: 150,
  minSavingsPercent: 20,
};

export function analyzeForSubscription(
  monthlyApiCost: number,
  usagePattern?: {
    averageMessagesPerDay?: number;
    interactivePercent?: number;
    codingPercent?: number;
  },
): SubscriptionAdvice {
  // Determine recommended plan tier
  let recommendedPlan: "pro" | "max5x" | "max20x";
  let reason: string;

  if (monthlyApiCost > THRESHOLDS.max20xThreshold) {
    recommendedPlan = "max20x";
    reason = `API cost ($${monthlyApiCost.toFixed(0)}/mo) exceeds $150. Max 20x ($200/mo) provides nearly unlimited usage.`;
  } else if (monthlyApiCost > THRESHOLDS.max5xThreshold) {
    recommendedPlan = "max5x";
    reason = `API cost ($${monthlyApiCost.toFixed(0)}/mo) exceeds $70. Max 5x ($100/mo) would save ~$${(monthlyApiCost - 100).toFixed(0)}/mo.`;
  } else if (monthlyApiCost > THRESHOLDS.proThreshold) {
    recommendedPlan = "pro";
    reason = `API cost ($${monthlyApiCost.toFixed(0)}/mo) exceeds $15. Pro ($20/mo) would provide more value.`;
  } else {
    return {
      shouldRecommend: false,
      plan: "pro",
      monthlyCost: 20,
      estimatedApiCost: monthlyApiCost,
      savings: 0,
      savingsPercent: 0,
      reason: `API cost ($${monthlyApiCost.toFixed(2)}/mo) is lower than Pro. Keep using API.`,
    };
  }

  const subscriptionCost = SUBSCRIPTION_PRICING[recommendedPlan].monthly;
  const savings = monthlyApiCost - subscriptionCost;
  const savingsPercent = (savings / monthlyApiCost) * 100;

  // Below savings threshold
  if (savingsPercent < THRESHOLDS.minSavingsPercent) {
    return {
      shouldRecommend: false,
      plan: recommendedPlan,
      monthlyCost: subscriptionCost,
      estimatedApiCost: monthlyApiCost,
      savings,
      savingsPercent,
      reason: `Potential savings (${savingsPercent.toFixed(0)}%) below threshold. Continue monitoring.`,
    };
  }

  // Mostly automation — subscription not ideal
  if (usagePattern && (usagePattern.interactivePercent ?? 100) < 30) {
    return {
      shouldRecommend: false,
      plan: recommendedPlan,
      monthlyCost: subscriptionCost,
      estimatedApiCost: monthlyApiCost,
      savings,
      savingsPercent,
      reason: `Usage is mostly automation (${100 - (usagePattern.interactivePercent ?? 100)}%). Subscription optimized for interactive use. Continue with API.`,
    };
  }

  return {
    shouldRecommend: true,
    plan: recommendedPlan,
    monthlyCost: subscriptionCost,
    estimatedApiCost: monthlyApiCost,
    savings,
    savingsPercent: Math.round(savingsPercent),
    reason,
  };
}

export function generateSubscriptionComparison(monthlyApiCost: number): SubscriptionComparison {
  const options = [
    { name: "api" as const, cost: monthlyApiCost },
    { name: "pro" as const, cost: SUBSCRIPTION_PRICING.pro.monthly },
    { name: "max5x" as const, cost: SUBSCRIPTION_PRICING.max5x.monthly },
    { name: "max20x" as const, cost: SUBSCRIPTION_PRICING.max20x.monthly },
  ];

  const cheapest = options.reduce((a, b) => (a.cost < b.cost ? a : b));

  return {
    apiCost: monthlyApiCost,
    proCost: 20,
    max5xCost: 100,
    max20xCost: 200,
    cheapestOption: cheapest.name,
    potentialSavings: Math.max(0, monthlyApiCost - cheapest.cost),
  };
}

export function formatSubscriptionAdvice(advice: SubscriptionAdvice): string {
  if (!advice.shouldRecommend) return advice.reason;

  const planName =
    advice.plan === "pro"
      ? "Claude Pro"
      : advice.plan === "max5x"
        ? "Claude Max 5x"
        : "Claude Max 20x";

  return [
    "SUBSCRIPTION RECOMMENDATION",
    "",
    advice.reason,
    "",
    "Comparison:",
    `  - Your API cost: $${advice.estimatedApiCost.toFixed(0)}/month`,
    `  - ${planName}: $${advice.monthlyCost}/month`,
    `  - Potential savings: $${advice.savings.toFixed(0)}/month (${advice.savingsPercent}%)`,
  ].join("\n");
}
