import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

type Decision = "ALLOW" | "WARN" | "BLOCK";
type AuthorityMode = "AUTONOMOUS" | "SUPERVISED" | "BLOCKED";

type Displacement = {
  temporal: string;
  system: string;
  energy: string;
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
  confidence: number;
  timestamp: string;
};

type EvaluationRequestInputs = {
  action: string;
  systemState: string;
  actorRole: string | null;
  requestedAuthority: string | null;
  requiresApproval: boolean;
};

type LogEntry = EvaluationRequestInputs & EvaluationResponse;
type EvaluationCoreResponse = Omit<EvaluationResponse, "id" | "timestamp">;

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

function parseEvaluationInputs(body: any): EvaluationRequestInputs {
  return {
    action: body?.action ?? "",
    systemState: body?.systemState ?? "stable",
    actorRole: typeof body?.actorRole === "string" ? body.actorRole : null,
    requestedAuthority:
      typeof body?.requestedAuthority === "string" ? body.requestedAuthority : null,
    requiresApproval: body?.requiresApproval === true || body?.requiresApproval === "true",
  };
}

function hasReplayInputs(entry: any): entry is LogEntry {
  return (
    typeof entry?.action === "string" &&
    typeof entry?.systemState === "string" &&
    (typeof entry?.actorRole === "string" || entry?.actorRole === null) &&
    (typeof entry?.requestedAuthority === "string" || entry?.requestedAuthority === null) &&
    typeof entry?.requiresApproval === "boolean"
  );
}

 http://localhost:3001
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

function evaluateAction(action: string, systemState: string) {
  if (action === "Deploy Code Update") {
    if (systemState === "drift") {
      return {
        decision: "BLOCK",
        reason: "System already in drift — deployment amplifies instability",
        displacement: {
          temporal: "HIGH",
          system: "HIGH",
          energy: "MEDIUM",
        },
        confidence: 0.93,
      };
    }

    return {
      decision: "ALLOW",
      reason: "System stable — deployment within safe bounds",
      displacement: {
        temporal: "LOW",
        system: "LOW",
        energy: "LOW",
      },
      confidence: 0.89,
    };
  }

  if (action === "Config Change with Drift Risk") {
    return {
      decision: "WARN",
      reason: "Policy alignment uncertainty detected",
      displacement: {
        temporal: "MEDIUM",
        system: "MEDIUM",
        energy: "LOW",
      },
      confidence: 0.72,
    };
  }

  return {
    decision: "ALLOW",
    reason: "No critical displacement detected",
    displacement: {
      temporal: "LOW",
      system: "LOW",
      energy: "LOW",
    },
    confidence: 0.98,
  };
}

function buildEvaluationResponse(inputs: EvaluationRequestInputs): EvaluationCoreResponse {
  const authority = evaluateAuthority(
    inputs.actorRole ?? undefined,
    inputs.requestedAuthority ?? undefined,
    inputs.requiresApproval
  );

  // SAFE READ
  if (inputs.action === "safe_read") {
    return {
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
    };
  }

  // CONFIG CHANGE
  if (inputs.action === "config_change") {
    if (inputs.systemState === "drift") {
      return {
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
      };
    }

    return {
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
    };
  }

  // DEPLOY UPDATE (THIS IS THE IMPORTANT ONE)
  if (inputs.action === "deploy_update") {
    if (inputs.systemState === "drift") {
      return {
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
      };
    }

    return {
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
    };
  }

  return {
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
  };
}

app.post("/evaluate", (req, res) => {
  const requestInputs = parseEvaluationInputs(req.body);
  const evaluation: EvaluationResponse = {
    id: createEvaluationId(),
    ...buildEvaluationResponse(requestInputs),
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

  const replayed = buildEvaluationResponse({
    action: original.action,
    systemState: original.systemState,
    actorRole: original.actorRole,
    requestedAuthority: original.requestedAuthority,
    requiresApproval: original.requiresApproval,
  });

  return res.json({
    id: original.id,
    original: {
      decision: original.decision,
      authorityMode: original.authorityMode,
    },
    replayed: {
      decision: replayed.decision,
      authorityMode: replayed.authorityMode,
    },
    decisionMatches: original.decision === replayed.decision,
    authorityMatches: original.authorityMode === replayed.authorityMode,
  });
});

app.listen(PORT, () => {
  ensureLogsFileExists();
  console.log(`Orientation Gate backend running on http://localhost:${PORT}`);
});
