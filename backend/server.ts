import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

type Decision = "ALLOW" | "WARN" | "BLOCK";
type AuthorityMode = "AUTONOMOUS" | "SUPERVISED" | "BLOCKED";
type ExecutionOutcome = "EXECUTE" | "ESCALATE" | "DENY";
type StateAdmissibility = "STATE_ADMISSIBLE" | "STATE_AT_RISK" | "STATE_INADMISSIBLE";

type Displacement = {
  temporal: string;
  system: string;
  energy: string;
};

type SystemModelState = {
  stability: number;
  configurationIntegrity: number;
  resourcePressure: number;
};

type EvaluationResponse = {
  id: string;
  actionAttempted: string;
  coherenceCheck: string;
  decision: Decision;
  reason: string;
  displacement: Displacement;
  authorityMode: AuthorityMode;
  authorityReason: string;
  executionOutcome: ExecutionOutcome;
  previousState: SystemModelState;
  resultingState: SystemModelState;
  stateAdmissibility: StateAdmissibility;
  confidence: number;
  timestamp: string;
};

type ReplayResponse = {
  id: string;
  original: {
    decision: Decision;
    authorityMode: AuthorityMode;
    executionOutcome: ExecutionOutcome;
    resultingState: SystemModelState;
    stateAdmissibility: StateAdmissibility;
  };
  replayed: {
    decision: Decision;
    authorityMode: AuthorityMode;
    executionOutcome: ExecutionOutcome;
    resultingState: SystemModelState;
    stateAdmissibility: StateAdmissibility;
  };
  decisionMatches: boolean;
  authorityMatches: boolean;
  executionOutcomeMatches: boolean;
  stateTransitionMatches: boolean;
};

type EvaluationRequestInputs = {
  action: string;
  systemState: string;
  actorRole: string | null;
  requestedAuthority: string | null;
  requiresApproval: boolean;
  previousState: SystemModelState;
};

type LogEntry = EvaluationRequestInputs & EvaluationResponse;
type EvaluationCoreResponse = Omit<EvaluationResponse, "id" | "timestamp">;
type EvaluationCoreResponseInput = Omit<
  EvaluationCoreResponse,
  "executionOutcome" | "previousState" | "resultingState" | "stateAdmissibility"
> & {
  executionOutcome?: ExecutionOutcome;
  previousState?: SystemModelState;
  resultingState?: SystemModelState;
  stateAdmissibility?: StateAdmissibility;
};

const DEFAULT_SYSTEM_MODEL_STATE: SystemModelState = {
  stability: 1.0,
  configurationIntegrity: 1.0,
  resourcePressure: 0.0,
};

const LOGS_FILE_PATH = path.join(process.cwd(), "logs.json");

function ensureLogsFileExists() {
  if (!fs.existsSync(LOGS_FILE_PATH)) {
    fs.writeFileSync(LOGS_FILE_PATH, "[]", "utf-8");
  }
}

function readLogs(): LogEntry[] {
  ensureLogsFileExists();

  const fileContents = fs.readFileSync(LOGS_FILE_PATH, "utf-8");

  try {
    const parsed = JSON.parse(fileContents);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLogs(logs: LogEntry[]) {
  fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logs, null, 2), "utf-8");
}

function appendLog(entry: LogEntry) {
  const logs = readLogs();
  logs.unshift(entry);
  writeLogs(logs);
}

function createEvaluationId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampMetric(value: number) {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function parseState(value: any): SystemModelState {
  return {
    stability:
      typeof value?.stability === "number"
        ? clampMetric(value.stability)
        : DEFAULT_SYSTEM_MODEL_STATE.stability,
    configurationIntegrity:
      typeof value?.configurationIntegrity === "number"
        ? clampMetric(value.configurationIntegrity)
        : DEFAULT_SYSTEM_MODEL_STATE.configurationIntegrity,
    resourcePressure:
      typeof value?.resourcePressure === "number"
        ? clampMetric(value.resourcePressure)
        : DEFAULT_SYSTEM_MODEL_STATE.resourcePressure,
  };
}

function parseEvaluationInputs(body: any): EvaluationRequestInputs {
  return {
    action: body?.action ?? "",
    systemState: body?.systemState ?? "stable",
    actorRole: typeof body?.actorRole === "string" ? body.actorRole : null,
    requestedAuthority:
      typeof body?.requestedAuthority === "string" ? body.requestedAuthority : null,
    requiresApproval: body?.requiresApproval === true || body?.requiresApproval === "true",
    previousState: parseState(body?.previousState),
  };
}

function hasReplayInputs(entry: any): entry is LogEntry {
  return (
    typeof entry?.action === "string" &&
    typeof entry?.systemState === "string" &&
    (typeof entry?.actorRole === "string" || entry?.actorRole === null) &&
    (typeof entry?.requestedAuthority === "string" || entry?.requestedAuthority === null) &&
    typeof entry?.requiresApproval === "boolean" &&
    typeof entry?.decision === "string" &&
    typeof entry?.authorityMode === "string"
  );
}

app.get("/", (_req, res) => {
  res.send("Orientation Gate backend alive");
});

app.get("/logs", (_req, res) => {
  const logs = readLogs();
  res.json(logs);
});

function evaluateAuthority(
  actorRole?: string,
  requestedAuthority?: string,
  requiresApproval?: boolean
) {
  const normalizedActorRole = actorRole?.toLowerCase();
  const normalizedRequestedAuthority = requestedAuthority?.toLowerCase();

  const roleRank: Record<string, number> = {
    viewer: 1,
    operator: 2,
    maintainer: 3,
    admin: 4,
    owner: 5,
  };

  const authorityRank: Record<string, number> = {
    read: 1,
    execute: 2,
    configure: 3,
    deploy: 4,
    admin: 5,
    owner: 5,
  };

  if (!normalizedActorRole && !normalizedRequestedAuthority && !requiresApproval) {
    return {
      authorityMode: "AUTONOMOUS" as AuthorityMode,
      authorityReason: "No authority escalation requested.",
    };
  }

  const actorRank = normalizedActorRole ? roleRank[normalizedActorRole] : undefined;
  const requestedRank = normalizedRequestedAuthority
    ? authorityRank[normalizedRequestedAuthority]
    : undefined;

  if (normalizedActorRole && actorRank === undefined) {
    return {
      authorityMode: "SUPERVISED" as AuthorityMode,
      authorityReason: `Actor role '${actorRole}' is not recognized and requires review.`,
    };
  }

  if (normalizedRequestedAuthority && requestedRank === undefined) {
    return {
      authorityMode: "SUPERVISED" as AuthorityMode,
      authorityReason: `Requested authority '${requestedAuthority}' is not recognized and requires review.`,
    };
  }

  if (requestedRank !== undefined && actorRank !== undefined && requestedRank > actorRank) {
    return {
      authorityMode: "BLOCKED" as AuthorityMode,
      authorityReason: `Requested authority '${requestedAuthority}' exceeds actor role '${actorRole}'.`,
    };
  }

  if (requestedRank !== undefined && actorRank === undefined) {
    return {
      authorityMode: "SUPERVISED" as AuthorityMode,
      authorityReason: `Requested authority '${requestedAuthority}' requires review because actor role is missing or unknown.`,
    };
  }

  if (requiresApproval) {
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

function resolveExecutionOutcome(decision: Decision, authorityMode: AuthorityMode): ExecutionOutcome {
  if (decision === "BLOCK") {
    return "DENY";
  }

  if (authorityMode === "BLOCKED") {
    return "DENY";
  }

  if (authorityMode === "SUPERVISED") {
    return "ESCALATE";
  }

  if (decision === "WARN") {
    return "ESCALATE";
  }

  return "EXECUTE";
}

function applyStateTransition(action: string, previousState: SystemModelState): SystemModelState {
  if (action === "config_change") {
    return {
      stability: previousState.stability,
      configurationIntegrity: clampMetric(previousState.configurationIntegrity - 0.25),
      resourcePressure: clampMetric(previousState.resourcePressure + 0.05),
    };
  }

  if (action === "deploy_update") {
    return {
      stability: clampMetric(previousState.stability - 0.1),
      configurationIntegrity: previousState.configurationIntegrity,
      resourcePressure: clampMetric(previousState.resourcePressure + 0.3),
    };
  }

  return {
    stability: previousState.stability,
    configurationIntegrity: previousState.configurationIntegrity,
    resourcePressure: previousState.resourcePressure,
  };
}

function evaluateStateAdmissibility(state: SystemModelState): StateAdmissibility {
  if (
    state.stability < 0.5 ||
    state.configurationIntegrity < 0.5 ||
    state.resourcePressure > 0.8
  ) {
    return "STATE_INADMISSIBLE";
  }

  if (
    state.stability < 0.7 ||
    state.configurationIntegrity < 0.7 ||
    state.resourcePressure > 0.6
  ) {
    return "STATE_AT_RISK";
  }

  return "STATE_ADMISSIBLE";
}

function statesMatch(a: SystemModelState, b: SystemModelState) {
  return (
    a.stability === b.stability &&
    a.configurationIntegrity === b.configurationIntegrity &&
    a.resourcePressure === b.resourcePressure
  );
}

function actionFromLabel(actionAttempted: string) {
  if (actionAttempted === "Config Change" || actionAttempted === "Config Change with Drift Risk") {
    return "config_change";
  }

  if (actionAttempted === "Deploy Code Update") {
    return "deploy_update";
  }

  if (actionAttempted === "Safe Read Operation") {
    return "safe_read";
  }

  return "";
}

function normalizeEvaluationResponse(response: EvaluationCoreResponseInput): EvaluationCoreResponse {
  const previousState = response.previousState ?? DEFAULT_SYSTEM_MODEL_STATE;
  const resultingState =
    response.resultingState ?? applyStateTransition(actionFromLabel(response.actionAttempted), previousState);

  return {
    ...response,
    executionOutcome: response.executionOutcome ?? resolveExecutionOutcome(response.decision, response.authorityMode),
    previousState,
    resultingState,
    stateAdmissibility:
      response.stateAdmissibility ?? evaluateStateAdmissibility(resultingState),
  };
}

function buildReplayResponse(original: LogEntry, replayed: EvaluationCoreResponse): ReplayResponse {
  const normalizedReplay = normalizeEvaluationResponse(replayed);
  const originalExecutionOutcome =
    original.executionOutcome ?? resolveExecutionOutcome(original.decision, original.authorityMode);
  const originalPreviousState = original.previousState ?? DEFAULT_SYSTEM_MODEL_STATE;
  const originalResultingState =
    original.resultingState ?? applyStateTransition(original.action, originalPreviousState);
  const originalStateAdmissibility =
    original.stateAdmissibility ?? evaluateStateAdmissibility(originalResultingState);

  return {
    id: original.id,
    original: {
      decision: original.decision,
      authorityMode: original.authorityMode,
      executionOutcome: originalExecutionOutcome,
      resultingState: originalResultingState,
      stateAdmissibility: originalStateAdmissibility,
    },
    replayed: {
      decision: normalizedReplay.decision,
      authorityMode: normalizedReplay.authorityMode,
      executionOutcome: normalizedReplay.executionOutcome,
      resultingState: normalizedReplay.resultingState,
      stateAdmissibility: normalizedReplay.stateAdmissibility,
    },
    decisionMatches: original.decision === normalizedReplay.decision,
    authorityMatches: original.authorityMode === normalizedReplay.authorityMode,
    executionOutcomeMatches: originalExecutionOutcome === normalizedReplay.executionOutcome,
    stateTransitionMatches:
      statesMatch(originalResultingState, normalizedReplay.resultingState) &&
      originalStateAdmissibility === normalizedReplay.stateAdmissibility,
  };
}

function buildEvaluationResponse(inputs: EvaluationRequestInputs): EvaluationCoreResponse {
  const authority = evaluateAuthority(
    inputs.actorRole ?? undefined,
    inputs.requestedAuthority ?? undefined,
    inputs.requiresApproval
  );
  const resultingState = applyStateTransition(inputs.action, inputs.previousState);
  const stateAdmissibility = evaluateStateAdmissibility(resultingState);

  const withGovernanceOutcomes = (
    response: Omit<
      EvaluationCoreResponse,
      "executionOutcome" | "previousState" | "resultingState" | "stateAdmissibility"
    >
  ): EvaluationCoreResponse =>
    normalizeEvaluationResponse({
      ...response,
      previousState: inputs.previousState,
      resultingState,
      stateAdmissibility,
    });

  // SAFE READ
  if (inputs.action === "safe_read") {
    return withGovernanceOutcomes({
      actionAttempted: "Safe Read Operation",
      coherenceCheck: "PASSED",
      decision: "ALLOW",
      reason: "No critical displacement detected",
      displacement: {
        temporal: "LOW",
        system: "LOW",
        energy: "LOW",
      },
      confidence: 0.98,
      ...authority,
    });
  }

  // CONFIG CHANGE
  if (inputs.action === "config_change") {
    if (inputs.systemState === "drift") {
      return withGovernanceOutcomes({
        actionAttempted: "Config Change with Drift Risk",
        coherenceCheck: "DEGRADED",
        decision: "WARN",
        reason: "Policy alignment uncertainty detected",
        displacement: {
          temporal: "MEDIUM",
          system: "HIGH",
          energy: "LOW",
        },
        confidence: 0.72,
        ...authority,
      });
    }

    return withGovernanceOutcomes({
      actionAttempted: "Config Change",
      coherenceCheck: "PASSED",
      decision: "ALLOW",
      reason: "System stable",
      displacement: {
        temporal: "LOW",
        system: "LOW",
        energy: "LOW",
      },
      confidence: 0.9,
      ...authority,
    });
  }

  // DEPLOY UPDATE
  if (inputs.action === "deploy_update") {
    if (inputs.systemState === "drift") {
      return withGovernanceOutcomes({
        actionAttempted: "Deploy Code Update",
        coherenceCheck: "FAILED",
        decision: "BLOCK",
        reason: "Temporal + System Drift",
        displacement: {
          temporal: "HIGH",
          system: "HIGH",
          energy: "MEDIUM",
        },
        confidence: 0.91,
        ...authority,
      });
    }

    return withGovernanceOutcomes({
      actionAttempted: "Deploy Code Update",
      coherenceCheck: "PASSED",
      decision: "ALLOW",
      reason: "System stable",
      displacement: {
        temporal: "LOW",
        system: "LOW",
        energy: "LOW",
      },
      confidence: 0.95,
      ...authority,
    });
  }

  return withGovernanceOutcomes({
    actionAttempted: "Unknown Action",
    coherenceCheck: "PASSED",
    decision: "ALLOW",
    reason: "Default allow",
    displacement: {
      temporal: "LOW",
      system: "LOW",
      energy: "LOW",
    },
    confidence: 0.8,
    ...authority,
  });
}

app.post("/evaluate", (req, res) => {
  const requestInputs = parseEvaluationInputs(req.body);
  const evaluationCore = normalizeEvaluationResponse(buildEvaluationResponse(requestInputs));
  const evaluation: EvaluationResponse = {
    id: createEvaluationId(),
    ...evaluationCore,
    timestamp: new Date().toISOString(),
  };

  appendLog({
    ...requestInputs,
    ...evaluation,
  });

  return res.json(evaluation);
});

app.post("/replay/:id", (req, res) => {
  const logs = readLogs();
  const original = logs.find((entry) => entry.id === req.params.id);

  if (!original) {
    return res.status(404).json({
      error: "Evaluation log not found",
    });
  }

  if (!hasReplayInputs(original)) {
    return res.status(400).json({
      error: "Evaluation log does not contain replay inputs",
    });
  }

  const replayed = normalizeEvaluationResponse(
    buildEvaluationResponse({
      action: original.action,
      systemState: original.systemState,
      actorRole: original.actorRole,
      requestedAuthority: original.requestedAuthority,
      requiresApproval: original.requiresApproval,
      previousState: original.previousState ?? DEFAULT_SYSTEM_MODEL_STATE,
    })
  );

  return res.json(buildReplayResponse(original, replayed));
});

app.listen(PORT, () => {
  ensureLogsFileExists();
  console.log(`Orientation Gate backend running on http://localhost:${PORT}`);
});
