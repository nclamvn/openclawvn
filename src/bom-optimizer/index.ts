/**
 * Token Optimization Engine - Main Exports
 */

// Router
export { SmartRouter, router, routeRequest } from "./router/index.js";
export { classifyTask, quickClassify } from "./router/classifier.js";
export { compressContext, compressAndMerge } from "./router/compressor.js";

// Cache
export { CacheManager, cache, exactCache, semanticCache } from "./cache/index.js";

// Checkpoint
export {
  Workflow,
  createWorkflow,
  resumeWorkflow,
  getResumableWorkflows,
  deleteWorkflow,
} from "./checkpoint/index.js";

// Tracker
export { CostTracker, createTracker, metricsStore, reporter } from "./tracker/index.js";

// Middleware
export { createOptimizationMiddleware } from "./middleware/optimization-middleware.js";

// Config
export { MODELS, TASK_MODEL_MAP, DEFAULT_CACHE_CONFIG, DEFAULT_COST_LIMITS } from "./config.js";

// Types
export * from "./types.js";
