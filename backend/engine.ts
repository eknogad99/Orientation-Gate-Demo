import type { OrientationPolicy } from "./policy.ts";

export const ENGINE_VERSION = "1.0.0-rc.1";

export type Action = "safe_read" | "config_change" | "deploy_update";
export type OperatingContext = "stable" | "drift";
export type ActorRole = "viewer" | "operator" | "maintainer" | "admin" | "owner";
export type RequestedAuthority = "read" | "execute" | "configure" | "deploy" | "admin" | "owner";
export type Decision = "ALLOW" | "WARN" | "BLOCK";
export type AuthorityMode = "AUTONOMOUS" | "SUPERVISED" | "BLOCKED";
export type ExecutionOutcome = "EXECUTE" | "ESCALATE" | "DENY";
export type StateAdmissibility = "STATE_ADMISSIBLE" | "STATE_AT_RISK" | "STATE_INADMISSIBLE";

export type Displacement = {
  temporal: "LOW" | "MEDIUM" | "HIGH";
  system: "LOW" | "MEDIUM" | "HIGH";
  energy: "LOW" | "MEDIUM" | "HIGH";
};

export type SystemModelState = {
  stability: number;
  configurationIntegrity: number;
  resourcePressure: number;
};

export type EvaluationRequestInputs = {
  action: Action;
  operatingContext: OperatingContext;
  actorRole: ActorRole | null;
  requestedAuthority: RequestedAuthority | null;
  requiresApproval: boolean;
  previousState: SystemModelState;
};

export type EvaluationCore = {
  actionAttempted: string;
  coherenceCheck: "PASSED" | "DEGRADED" | "FAILED";
  decision: Decision;
  reason: string;
  ruleId: string;
  displacement: Displacement;
  authorityMode: AuthorityMode;
  authorityReason: string;
  executionOutcome: ExecutionOutcome;
  previousState: SystemModelState;
  resultingState: SystemModelState;
  stateAdmissibility: StateAdmissibility;
  confidence: number;
  policyVersion: string;
  engineVersion: string;
};

export type ValidationFailure = {
  ok: false;
  code: "OG-INVALID-REQUEST";
  errors: string[];
  executionOutcome: "DENY";
};

export type ValidationSuccess = {
  ok: true;
  value: EvaluationRequestInputs;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

export type GovernedExecutionResult<T> = {
  evaluation: EvaluationCore;
  executorInvoked: boolean;
  executorResult?: T;
};

const ACTIONS: Action[] = ["safe_read", "config_change", "deploy_update"];
const OPERATING_CONTEXTS: OperatingContext[] = ["stable", "drift"];
const ACTOR_ROLES: ActorRole[] = ["viewer", "operator", "maintainer", "admin", "owner"];
const AUTHORITIES: RequestedAuthority[] = ["read", "execute", "configure", "deploy", "admin", "owner"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function isMetric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateEvaluationRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return {
      ok: false,
      code: "OG-INVALID-REQUEST",
      errors: ["Request body must be a JSON object."],
      executionOutcome: "DENY",
    };
  }

  if (!isOneOf(body.action, ACTIONS)) {
    errors.push(`action must be one of: ${ACTIONS.join(", ")}.`);
  }

  if (!isOneOf(body.operatingContext, OPERATING_CONTEXTS)) {
    errors.push(`operatingContext must be one of: ${OPERATING_CONTEXTS.join(", ")}.`);
  }

  if (!isRecord(body.previousState)) {
    errors.push("previousState is required and must be an object.");
  } else {
    if (!isMetric(body.previousState.stability)) {
      errors.push("previousState.stability must be a finite number from 0 to 1.");
    }
    if (!isMetric(body.previousState.configurationIntegrity)) {
      errors.push("previousState.configurationIntegrity must be a finite number from 0 to 1.");
    }
    if (!isMetric(body.previousState.resourcePressure)) {
      errors.push("previousState.resourcePressure must be a finite number from 0 to 1.");
    }
  }

  const actorRole = body.actorRole ?? null;
  const requestedAuthority = body.requestedAuthority ?? null;
  if (actorRole !== null && !isOneOf(actorRole, ACTOR_ROLES)) {
    errors.push(`actorRole must be null or one of: ${ACTOR_ROLES.join(", ")}.`);
  }
  if (requestedAuthority !== null && !isOneOf(requestedAuthority, AUTHORITIES)) {
    errors.push(`requestedAuthority must be null or one of: ${AUTHORITIES.join(", ")}.`);
  }
  if ((actorRole === null) !== (requestedAuthority === null)) {
    errors.push("actorRole and requestedAuthority must be provided together.");
  }
  if (body.requiresApproval !== undefined && typeof body.requiresApproval !== "boolean") {
    errors.push("requiresApproval must be a boolean when provided.");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      code: "OG-INVALID-REQUEST",
      errors,
      executionOutcome: "DENY",
    };
  }

  const previousState = body.previousState as Record<string, number>;
  return {
    ok: true,
    value: {
      action: body.action as Action,
      operatingContext: body.operatingContext as OperatingContext,
      actorRole: actorRole as ActorRole | null,
      requestedAuthority: requestedAuthority as RequestedAuthority | null,
      requiresApproval: body.requiresApproval === true,
      previousState: {
        stability: previousState.stability,
        configurationIntegrity: previousState.configurationIntegrity,
        resourcePressure: previousState.resourcePressure,
      },
    },
  };
}

function clampMetric(value: number) {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

export function evaluateStateAdmissibility(
  state: SystemModelState,
  policy: OrientationPolicy
): StateAdmissibility {
  const { inadmissible, atRisk } = policy.stateThresholds;
  if (
    state.stability < inadmissible.minStability ||
    state.configurationIntegrity < inadmissible.minConfigurationIntegrity ||
    state.resourcePressure > inadmissible.maxResourcePressure
  ) {
    return "STATE_INADMISSIBLE";
  }

  if (
    state.stability < atRisk.minStability ||
    state.configurationIntegrity < atRisk.minConfigurationIntegrity ||
    state.resourcePressure > atRisk.maxResourcePressure
  ) {
    return "STATE_AT_RISK";
  }

  return "STATE_ADMISSIBLE";
}

function applyStateTransition(
  action: Action,
  previousState: SystemModelState,
  policy: OrientationPolicy
): SystemModelState {
  const delta = policy.stateTransitions[action];
  return {
    stability: clampMetric(previousState.stability + delta.stability),
    configurationIntegrity: clampMetric(
      previousState.configurationIntegrity + delta.configurationIntegrity
    ),
    resourcePressure: clampMetric(previousState.resourcePressure + delta.resourcePressure),
  };
}

function evaluateAuthority(inputs: EvaluationRequestInputs, policy: OrientationPolicy) {
  if (inputs.actorRole === null && inputs.requestedAuthority === null) {
    return {
      authorityMode: "AUTONOMOUS" as AuthorityMode,
      authorityReason: "No authority escalation requested.",
    };
  }

  const actorRank = policy.authority.roleRank[inputs.actorRole!];
  const requestedRank = policy.authority.requestRank[inputs.requestedAuthority!];
  if (requestedRank > actorRank) {
    return {
      authorityMode: "BLOCKED" as AuthorityMode,
      authorityReason: `Requested authority '${inputs.requestedAuthority}' exceeds actor role '${inputs.actorRole}'.`,
    };
  }

  if (inputs.requiresApproval) {
    return {
      authorityMode: "SUPERVISED" as AuthorityMode,
      authorityReason: "Action requires approval before execution.",
    };
  }

  return {
    authorityMode: "AUTONOMOUS" as AuthorityMode,
    authorityReason: "Actor role is sufficient for requested authority.",
  };
}

export function resolveExecutionOutcome(
  decision: Decision,
  authorityMode: AuthorityMode,
  stateAdmissibility: StateAdmissibility
): ExecutionOutcome {
  if (
    decision === "BLOCK" ||
    authorityMode === "BLOCKED" ||
    stateAdmissibility === "STATE_INADMISSIBLE"
  ) {
    return "DENY";
  }

  if (
    decision === "WARN" ||
    authorityMode === "SUPERVISED" ||
    stateAdmissibility === "STATE_AT_RISK"
  ) {
    return "ESCALATE";
  }

  return "EXECUTE";
}

export function evaluateAction(
  inputs: EvaluationRequestInputs,
  policy: OrientationPolicy
): EvaluationCore {
  const rule = policy.decisionRules.find(
    (candidate) =>
      candidate.action === inputs.action &&
      candidate.operatingContext === inputs.operatingContext
  );

  const authority = evaluateAuthority(inputs, policy);
  const resultingState = applyStateTransition(inputs.action, inputs.previousState, policy);
  const stateAdmissibility = evaluateStateAdmissibility(resultingState, policy);

  if (!rule) {
    return {
      actionAttempted: inputs.action,
      coherenceCheck: "FAILED",
      decision: "BLOCK",
      reason: "No policy rule matched the validated request.",
      ruleId: "OG-FAIL-CLOSED",
      displacement: { temporal: "HIGH", system: "HIGH", energy: "HIGH" },
      ...authority,
      executionOutcome: "DENY",
      previousState: inputs.previousState,
      resultingState,
      stateAdmissibility,
      confidence: 1,
      policyVersion: policy.version,
      engineVersion: ENGINE_VERSION,
    };
  }

  return {
    actionAttempted: rule.label,
    coherenceCheck: rule.coherenceCheck,
    decision: rule.decision,
    reason: rule.reason,
    ruleId: rule.id,
    displacement: rule.displacement,
    ...authority,
    executionOutcome: resolveExecutionOutcome(
      rule.decision,
      authority.authorityMode,
      stateAdmissibility
    ),
    previousState: inputs.previousState,
    resultingState,
    stateAdmissibility,
    confidence: rule.confidence,
    policyVersion: policy.version,
    engineVersion: ENGINE_VERSION,
  };
}

export async function executeGovernedAction<T>(
  inputs: EvaluationRequestInputs,
  policy: OrientationPolicy,
  executor: () => Promise<T>,
  onEvaluated?: (evaluation: EvaluationCore) => void | Promise<void>
): Promise<GovernedExecutionResult<T>> {
  const evaluation = evaluateAction(inputs, policy);
  await onEvaluated?.(evaluation);
  if (evaluation.executionOutcome !== "EXECUTE") {
    return { evaluation, executorInvoked: false };
  }

  const executorResult = await executor();
  return { evaluation, executorInvoked: true, executorResult };
}
