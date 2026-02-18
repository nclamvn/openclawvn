// Cost module exports

export * from "./types.js";

export {
  MODEL_PRICING,
  SUBSCRIPTION_PRICING,
  getPricing,
  getTierFromModel,
  calculateCost,
  isLongContext,
  LONG_CONTEXT_THRESHOLD,
} from "./pricing.js";

export {
  estimateTokens,
  estimateCost,
  compareCosts,
  formatCostMessage,
  formatComparisonMessage,
} from "./estimator.js";

export { BudgetManager, DEFAULT_BUDGET_CONFIG } from "./budget-manager.js";

export {
  analyzeForSubscription,
  generateSubscriptionComparison,
  formatSubscriptionAdvice,
} from "./subscription-advisor.js";

export { AlertManager } from "./alerts.js";

// Convenience: create pre-configured cost system
import { BudgetManager } from "./budget-manager.js";
import { AlertManager } from "./alerts.js";

export interface CostSystem {
  budget: BudgetManager;
  alerts: AlertManager;
}

export function createCostSystem(config?: {
  daily?: number;
  weekly?: number;
  monthly?: number;
  perRequest?: number;
}): CostSystem {
  const budget = new BudgetManager({
    daily: config?.daily,
    weekly: config?.weekly,
    monthly: config?.monthly,
    perRequest: config?.perRequest,
  });
  const alerts = new AlertManager();
  return { budget, alerts };
}
