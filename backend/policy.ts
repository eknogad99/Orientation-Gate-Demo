import fs from "fs";
import path from "path";
import type {
  Action,
  ActorRole,
  Decision,
  Displacement,
  OperatingContext,
  RequestedAuthority,
} from "./engine.ts";

type DecisionRule = {
  id: string;
  action: Action;
  operatingContext: OperatingContext;
  label: string;
  decision: Decision;
  reason: string;
  coherenceCheck: "PASSED" | "DEGRADED" | "FAILED";
  displacement: Displacement;
  confidence: number;
};

type StateThreshold = {
  minStability: number;
  minConfigurationIntegrity: number;
  maxResourcePressure: number;
};

export type OrientationPolicy = {
  version: string;
  decisionRules: DecisionRule[];
  stateTransitions: Record<
    Action,
    { stability: number; configurationIntegrity: number; resourcePressure: number }
  >;
  stateThresholds: {
    inadmissible: StateThreshold;
    atRisk: StateThreshold;
  };
  authority: {
    roleRank: Record<ActorRole, number>;
    requestRank: Record<RequestedAuthority, number>;
  };
};

export function loadPolicy(
  policyPath = path.join(process.cwd(), "policy.json")
): OrientationPolicy {
  const raw = fs.readFileSync(policyPath, "utf-8");
  const parsed = JSON.parse(raw) as OrientationPolicy;
  if (
    typeof parsed.version !== "string" ||
    !Array.isArray(parsed.decisionRules) ||
    parsed.decisionRules.length === 0
  ) {
    throw new Error("Orientation policy is missing required versioned rule data.");
  }
  return parsed;
}
