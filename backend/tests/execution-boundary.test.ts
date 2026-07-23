import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateAction,
  executeGovernedAction,
  validateEvaluationRequest,
  type EvaluationRequestInputs,
} from "../engine.ts";
import { loadPolicy } from "../policy.ts";

const policy = loadPolicy();
const healthyState = {
  stability: 1,
  configurationIntegrity: 1,
  resourcePressure: 0,
};

function request(
  overrides: Partial<EvaluationRequestInputs> = {}
): EvaluationRequestInputs {
  return {
    action: "safe_read",
    operatingContext: "stable",
    actorRole: null,
    requestedAuthority: null,
    requiresApproval: false,
    previousState: healthyState,
    ...overrides,
  };
}

test("only EXECUTE invokes the executor", async () => {
  const cases: Array<{
    name: string;
    inputs: EvaluationRequestInputs;
    outcome: "EXECUTE" | "ESCALATE" | "DENY";
    invoked: boolean;
  }> = [
    {
      name: "allow and autonomous",
      inputs: request(),
      outcome: "EXECUTE",
      invoked: true,
    },
    {
      name: "warn under drift",
      inputs: request({ action: "config_change", operatingContext: "drift" }),
      outcome: "ESCALATE",
      invoked: false,
    },
    {
      name: "approval required",
      inputs: request({
        actorRole: "maintainer",
        requestedAuthority: "configure",
        requiresApproval: true,
      }),
      outcome: "ESCALATE",
      invoked: false,
    },
    {
      name: "authority exceeded",
      inputs: request({ actorRole: "operator", requestedAuthority: "deploy" }),
      outcome: "DENY",
      invoked: false,
    },
    {
      name: "blocked under drift",
      inputs: request({ action: "deploy_update", operatingContext: "drift" }),
      outcome: "DENY",
      invoked: false,
    },
    {
      name: "resulting state at risk",
      inputs: request({
        previousState: {
          stability: 0.65,
          configurationIntegrity: 1,
          resourcePressure: 0,
        },
      }),
      outcome: "ESCALATE",
      invoked: false,
    },
    {
      name: "resulting state inadmissible",
      inputs: request({
        previousState: {
          stability: 0.4,
          configurationIntegrity: 1,
          resourcePressure: 0,
        },
      }),
      outcome: "DENY",
      invoked: false,
    },
  ];

  for (const scenario of cases) {
    let calls = 0;
    const result = await executeGovernedAction(scenario.inputs, policy, async () => {
      calls += 1;
      return "executed";
    });
    assert.equal(result.evaluation.executionOutcome, scenario.outcome, scenario.name);
    assert.equal(result.executorInvoked, scenario.invoked, scenario.name);
    assert.equal(calls, scenario.invoked ? 1 : 0, scenario.name);
  }
});

test("invalid and incomplete requests fail closed", () => {
  const cases: unknown[] = [
    {},
    { action: "unknown", operatingContext: "stable", previousState: healthyState },
    { action: "safe_read", operatingContext: "unknown", previousState: healthyState },
    { action: "safe_read", operatingContext: "stable" },
    {
      action: "safe_read",
      operatingContext: "stable",
      previousState: { ...healthyState, stability: 2 },
    },
    {
      action: "safe_read",
      operatingContext: "stable",
      previousState: healthyState,
      actorRole: "operator",
    },
  ];

  for (const body of cases) {
    const result = validateEvaluationRequest(body);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "OG-INVALID-REQUEST");
      assert.equal(result.executionOutcome, "DENY");
    }
  }
});

test("unmatched validated policy combinations fail closed", () => {
  const policyWithoutRule = {
    ...policy,
    decisionRules: policy.decisionRules.filter(
      (rule) => !(rule.action === "safe_read" && rule.operatingContext === "stable")
    ),
  };
  const evaluation = evaluateAction(request(), policyWithoutRule);
  assert.equal(evaluation.ruleId, "OG-FAIL-CLOSED");
  assert.equal(evaluation.decision, "BLOCK");
  assert.equal(evaluation.executionOutcome, "DENY");
});

test("evidence failure prevents executor invocation", async () => {
  let calls = 0;
  await assert.rejects(
    executeGovernedAction(
      request(),
      policy,
      async () => {
        calls += 1;
        return "executed";
      },
      () => {
        throw new Error("evidence unavailable");
      }
    ),
    /evidence unavailable/
  );
  assert.equal(calls, 0);
});
