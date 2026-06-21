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

type EvaluationResponse = {
  actionAttempted: string;
  coherenceCheck: string;
  decision: Decision;
  reason: string;
  displacement: string;
  authorityMode: AuthorityMode;
  authorityReason: string;
  timestamp: string;
};

type LogEntry = EvaluationResponse & {
  id: string;
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

app.post("/evaluate", (req, res) => {
  const action = req.body?.action ?? "";
  const systemState = req.body?.systemState ?? "stable";
  const requiresApproval =
    req.body?.requiresApproval === true || req.body?.requiresApproval === "true";
  const authority = evaluateAuthority(
    req.body?.actorRole,
    req.body?.requestedAuthority,
    requiresApproval
  );
  const withAuthority = <T extends object>(response: T) => ({
    ...response,
    ...authority,
  });

  // SAFE READ
  if (action === "safe_read") {
    return res.json(withAuthority({
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
      timestamp: new Date().toISOString(),
    }));
  }

  // CONFIG CHANGE
  if (action === "config_change") {
    if (systemState === "drift") {
      return res.json(withAuthority({
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
        timestamp: new Date().toISOString(),
      }));
    }

    return res.json(withAuthority({
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
      timestamp: new Date().toISOString(),
    }));
  }

  // DEPLOY UPDATE (THIS IS THE IMPORTANT ONE)
  if (action === "deploy_update") {
    if (systemState === "drift") {
      return res.json(withAuthority({
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
        timestamp: new Date().toISOString(),
      }));
    }

    return res.json(withAuthority({
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
      timestamp: new Date().toISOString(),
    }));
  }

  return res.json(withAuthority({
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
    timestamp: new Date().toISOString(),
  }));
});

app.listen(PORT, () => {
  ensureLogsFileExists();
  console.log(`Orientation Gate backend running on http://localhost:${PORT}`);
});
