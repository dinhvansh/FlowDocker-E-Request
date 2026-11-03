import {
  ApplicationFailure,
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from "@temporalio/workflow";
import {
  compileApprovalPlan,
  matchesCondition,
  type ApprovalStep,
} from "../../../packages/approval-runtime/src/plan";
import type { createApprovalActivities, RunRef } from "./activities";
const activities = proxyActivities<ReturnType<typeof createApprovalActivities>>(
  { startToCloseTimeout: "20 seconds", retry: { maximumAttempts: 5 } },
);
export const decisionWake = defineSignal("decisionWake");
export async function approvalRun(
  ref: RunRef,
): Promise<"APPROVED" | "REJECTED"> {
  let generation = 0;
  setHandler(decisionWake, () => {
    generation++;
  });
  let stopped = false;
  let branchFailed = false;
  const pinned = await activities.loadRun(ref);
  async function sequence(steps: ApprovalStep[]): Promise<boolean> {
    for (const step of steps) {
      if (stopped) return false;
      if (step.kind === "if") {
        if (
          !(await sequence(
            matchesCondition(step, pinned.input, pinned.exposed_fields)
              ? step.then
              : step.else,
          ))
        )
          return false;
      } else if (step.kind === "parallel") {
        const completed = await Promise.all(
          step.branches.map(async (branch) => {
            try {
              return await sequence(branch);
            } catch {
              stopped = true;
              branchFailed = true;
              return false;
            }
          }),
        );
        if (branchFailed)
          throw ApplicationFailure.nonRetryable(
            "Approval branch blocked",
            "APPROVAL_BLOCKED",
          );
        if (completed.some((value) => !value)) return false;
      } else {
        const ids = await activities.activateApproval(
          ref,
          step.id,
          step.assignees,
        );
        for (;;) {
          if (stopped) return false;
          const observed = generation;
          const status = await activities.readDecision(ref, ids);
          if (status === "REJECTED") {
            stopped = true;
            return false;
          }
          if (status === "APPROVED") break;
          // Signal is only a wakeup; committed PostgreSQL state is authoritative.
          await condition(
            () => generation !== observed || stopped,
            "5 seconds",
          );
        }
      }
    }
    return true;
  }
  let status: "APPROVED" | "REJECTED";
  try {
    const plan = compileApprovalPlan(pinned.plan, pinned.exposed_fields);
    status = (await sequence(plan.steps)) ? "APPROVED" : "REJECTED";
  } catch {
    stopped = true;
    await activities.cancelPending(ref);
    await activities.finishRun(ref, "BLOCKED");
    throw ApplicationFailure.nonRetryable(
      "Approval run blocked",
      "APPROVAL_BLOCKED",
    );
  }
  if (status === "REJECTED") await activities.cancelPending(ref);
  await activities.finishRun(ref, status);
  return status;
}
