/**
 * Workflow State Manager
 * Create, update, and resume multi-step workflows
 */

import { randomUUID } from "crypto";
import * as store from "./store.js";
import type { WorkflowCheckpoint, WorkflowStep } from "../types.js";

export class Workflow {
  private checkpoint: WorkflowCheckpoint;

  constructor(
    userId: string,
    name: string,
    steps: Array<{ name: string; input?: unknown }>,
    existingCheckpoint?: WorkflowCheckpoint,
  ) {
    if (existingCheckpoint) {
      this.checkpoint = existingCheckpoint;
    } else {
      const now = Date.now();
      this.checkpoint = {
        id: randomUUID(),
        userId,
        name,
        steps: steps.map((s, i) => ({
          id: `step_${i}`,
          name: s.name,
          status: "pending" as const,
          input: s.input,
        })),
        currentStepIndex: 0,
        status: "running",
        createdAt: now,
        updatedAt: now,
        totalTokens: { input: 0, output: 0 },
        totalCost: 0,
      };
      this.save();
    }
  }

  get id(): string {
    return this.checkpoint.id;
  }
  get status(): WorkflowCheckpoint["status"] {
    return this.checkpoint.status;
  }
  get currentStepIndex(): number {
    return this.checkpoint.currentStepIndex;
  }
  get currentStep(): WorkflowStep | null {
    return this.checkpoint.steps[this.checkpoint.currentStepIndex] || null;
  }
  get completedSteps(): WorkflowStep[] {
    return this.checkpoint.steps.filter((s) => s.status === "completed");
  }
  get totalCost(): number {
    return this.checkpoint.totalCost;
  }

  /** Get step output (for resuming) */
  getStepOutput(stepIndex: number): unknown | undefined {
    return this.checkpoint.steps[stepIndex]?.output;
  }

  startStep(): void {
    const step = this.currentStep;
    if (step) {
      step.status = "running";
      step.startedAt = Date.now();
      this.save();
    }
  }

  completeStep(
    output: unknown,
    metrics?: {
      inputTokens: number;
      outputTokens: number;
      cost: number;
      model?: string;
    },
  ): void {
    const step = this.currentStep;
    if (!step) return;

    step.status = "completed";
    step.output = output;
    step.completedAt = Date.now();

    if (metrics) {
      step.tokens = { input: metrics.inputTokens, output: metrics.outputTokens };
      step.cost = metrics.cost;
      step.model = metrics.model;
      this.checkpoint.totalTokens.input += metrics.inputTokens;
      this.checkpoint.totalTokens.output += metrics.outputTokens;
      this.checkpoint.totalCost += metrics.cost;
    }

    this.checkpoint.currentStepIndex++;
    if (this.checkpoint.currentStepIndex >= this.checkpoint.steps.length) {
      this.checkpoint.status = "completed";
    }
    this.save();
  }

  failStep(error: string): void {
    const step = this.currentStep;
    if (step) {
      step.status = "failed";
      step.error = error;
      step.completedAt = Date.now();
      this.checkpoint.status = "failed";
      this.save();
    }
  }

  skipStep(reason?: string): void {
    const step = this.currentStep;
    if (!step) return;

    step.status = "skipped";
    step.output = reason || "Skipped";
    step.completedAt = Date.now();
    this.checkpoint.currentStepIndex++;

    if (this.checkpoint.currentStepIndex >= this.checkpoint.steps.length) {
      this.checkpoint.status = "completed";
    }
    this.save();
  }

  pause(): void {
    this.checkpoint.status = "paused";
    this.save();
  }

  resume(): void {
    if (this.checkpoint.status === "paused") {
      this.checkpoint.status = "running";
      this.save();
    }
  }

  getSummary(): {
    id: string;
    name: string;
    status: string;
    progress: string;
    totalTokens: number;
    totalCost: number;
    elapsed: number;
  } {
    const completed = this.completedSteps.length;
    const total = this.checkpoint.steps.length;
    return {
      id: this.checkpoint.id,
      name: this.checkpoint.name,
      status: this.checkpoint.status,
      progress: `${completed}/${total}`,
      totalTokens: this.checkpoint.totalTokens.input + this.checkpoint.totalTokens.output,
      totalCost: this.checkpoint.totalCost,
      elapsed: Date.now() - this.checkpoint.createdAt,
    };
  }

  private save(): void {
    this.checkpoint.updatedAt = Date.now();
    store.save(this.checkpoint);
  }
}

export function createWorkflow(
  userId: string,
  name: string,
  steps: Array<{ name: string; input?: unknown }>,
): Workflow {
  return new Workflow(userId, name, steps);
}

export function resumeWorkflow(workflowId: string): Workflow | null {
  const checkpoint = store.get(workflowId);
  if (!checkpoint) return null;
  return new Workflow(checkpoint.userId, checkpoint.name, [], checkpoint);
}

export function getResumableWorkflows(userId: string): WorkflowCheckpoint[] {
  return store.getResumable(userId);
}

export function deleteWorkflow(workflowId: string): void {
  store.deleteCheckpoint(workflowId);
}
