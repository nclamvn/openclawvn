// Cost Transparency types

export type ModelTier = "haiku" | "sonnet" | "opus";

export interface ModelPricing {
  model: string;
  tier: ModelTier;
  inputPer1M: number;
  outputPer1M: number;
  longContextInputPer1M?: number;
  longContextOutputPer1M?: number;
}

export interface CostEstimate {
  model: string;
  tier: ModelTier;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  confidence: "high" | "medium" | "low";
  breakdown: {
    inputCost: number;
    outputCost: number;
  };
  isLongContext: boolean;
}

export interface CostComparison {
  current: CostEstimate;
  alternatives: AlternativeEstimate[];
  recommendation: string;
  subscriptionAdvice?: SubscriptionAdvice;
}

export interface AlternativeEstimate {
  model: string;
  tier: ModelTier;
  estimatedCost: number;
  costDifference: number;
  costDifferencePercent: number;
  tradeoff: string;
  recommended: boolean;
}

export interface SubscriptionAdvice {
  shouldRecommend: boolean;
  plan: "pro" | "max5x" | "max20x";
  monthlyCost: number;
  estimatedApiCost: number;
  savings: number;
  savingsPercent: number;
  reason: string;
}

// Budget types

export interface BudgetConfig {
  daily: number;
  weekly: number;
  monthly: number;
  perRequest: number;
  alertThresholds: number[];
}

export interface BudgetStatus {
  daily: BudgetPeriodStatus;
  weekly: BudgetPeriodStatus;
  monthly: BudgetPeriodStatus;
}

export interface BudgetPeriodStatus {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  periodStart: Date;
  periodEnd: Date;
  projectedOverage: number | null;
}

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
  budgetStatus: BudgetStatus;
  warnings: BudgetWarning[];
}

export interface BudgetWarning {
  level: "info" | "warning" | "critical";
  period: "daily" | "weekly" | "monthly";
  message: string;
  percentUsed: number;
}

// Alert types

export interface CostAlert {
  id: string;
  type: "budget_warning" | "budget_exceeded" | "high_cost_request" | "subscription_recommended";
  level: "info" | "warning" | "critical";
  message: string;
  details: Record<string, unknown>;
  createdAt: Date;
  acknowledged: boolean;
}

export type AlertHandler = (alert: CostAlert) => void | Promise<void>;

// Analytics types

export interface UsageAnalytics {
  period: "day" | "week" | "month";
  periodStart: Date;
  periodEnd: Date;
  totalCost: number;
  totalRequests: number;
  byModel: ModelUsage[];
  byTaskType: TaskTypeUsage[];
  averageCostPerRequest: number;
  peakUsageHour: number;
  costTrend: "increasing" | "decreasing" | "stable";
  subscriptionComparison: SubscriptionComparison;
}

export interface ModelUsage {
  model: string;
  tier: ModelTier;
  requests: number;
  totalCost: number;
  percentOfTotal: number;
  avgCostPerRequest: number;
}

export interface TaskTypeUsage {
  taskType: string;
  requests: number;
  totalCost: number;
  percentOfTotal: number;
  avgCostPerRequest: number;
  recommendedModel: string;
}

export interface SubscriptionComparison {
  apiCost: number;
  proCost: 20;
  max5xCost: 100;
  max20xCost: 200;
  cheapestOption: "api" | "pro" | "max5x" | "max20x";
  potentialSavings: number;
}

// User-facing messages

export interface CostMessage {
  preExecution: string;
  postExecution: string;
  budgetWarning?: string;
  recommendation?: string;
}
