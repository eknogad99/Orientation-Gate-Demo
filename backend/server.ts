import crypto from "crypto";
import { pathToFileURL } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { FileEvidenceStore, type EvidenceEntry, type EvidenceStore } from "./evidence-store.ts";
import {
  ENGINE_VERSION,
  evaluateAction,
  executeGovernedAction,
  type EvaluationCore,
  type EvaluationRequestInputs,
  validateEvaluationRequest,
} from "./engine.ts";
import { loadPolicy, type OrientationPolicy } from "./policy.ts";

const PORT = Number(process.env.PORT ?? 3001);

type EvaluationResponse = EvaluationCore & {
  id: string;
  timestamp: string;
};

function createEvaluation(
  inputs: EvaluationRequestInputs,
  policy: OrientationPolicy
): EvaluationResponse {
  return {
    id: crypto.randomUUID(),
    ...evaluateAction(inputs, policy),
    timestamp: new Date().toISOString(),
  };
}

function statesMatch(a: EvaluationCore["resultingState"], b: EvaluationCore["resultingState"]) {
  return (
    a.stability === b.stability &&
    a.configurationIntegrity === b.configurationIntegrity &&
    a.resourcePressure === b.resourcePressure
  );
}

function evidenceHasReplayContract(entry: EvidenceEntry) {
  return (
    typeof entry.id === "string" &&
    typeof entry.policyVersion === "string" &&
    typeof entry.engineVersion === "string" &&
    typeof entry.operatingContext === "string" &&
    typeof entry.executionOutcome === "string" &&
    entry.previousState !== undefined
  );
}

function allowedOrigins() {
  return new Set(
    (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:5174")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export function createApp(options?: {
  policy?: OrientationPolicy;
  evidenceStore?: EvidenceStore;
}) {
  const policy = options?.policy ?? loadPolicy();
  const evidenceStore = options?.evidenceStore ?? new FileEvidenceStore();
  const origins = allowedOrigins();
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin(origin, callback) {
        if (origin === undefined || origins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin is not permitted."));
      },
    })
  );
  app.use(express.json({ limit: "32kb", strict: true }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      policyVersion: policy.version,
      engineVersion: ENGINE_VERSION,
    });
  });

  app.get("/logs", (_req, res) => {
    if (process.env.ENABLE_LOG_API !== "true") {
      return res.status(403).json({
        code: "OG-LOG-API-DISABLED",
        error: "Audit log access is disabled by default.",
      });
    }
    return res.json(evidenceStore.list());
  });

  app.post("/evaluate", (req, res) => {
    const validation = validateEvaluationRequest(req.body);
    if (!validation.ok) {
      return res.status(400).json(validation);
    }

    const evaluation = createEvaluation(validation.value, policy);
    evidenceStore.append({ ...validation.value, ...evaluation });
    return res.json(evaluation);
  });

  app.post("/execute-demo", async (req, res, next) => {
    try {
      const validation = validateEvaluationRequest(req.body);
      if (!validation.ok) {
        return res.status(400).json({ ...validation, executorInvoked: false });
      }

      let evaluation: EvaluationResponse | undefined;
      const result = await executeGovernedAction(
        validation.value,
        policy,
        async () => ({
          executedAt: new Date().toISOString(),
          receipt: crypto.randomUUID(),
        }),
        (evaluated) => {
          evaluation = {
            id: crypto.randomUUID(),
            ...evaluated,
            timestamp: new Date().toISOString(),
          };
          evidenceStore.append({ ...validation.value, ...evaluation });
        }
      );
      if (evaluation === undefined) {
        throw new Error("Evaluation evidence was not created.");
      }
      return res.json({
        evaluation,
        executorInvoked: result.executorInvoked,
        executorResult: result.executorResult,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/replay/:id", (req, res) => {
    const original = evidenceStore.find(req.params.id);
    if (!original) {
      return res.status(404).json({
        code: "OG-EVIDENCE-NOT-FOUND",
        error: "Evaluation evidence not found.",
      });
    }

    if (!evidenceHasReplayContract(original)) {
      return res.status(409).json({
        code: "OG-LEGACY-EVIDENCE",
        error: "Evaluation evidence does not contain the Version 1.0 replay contract.",
      });
    }

    if (
      original.policyVersion !== policy.version ||
      original.engineVersion !== ENGINE_VERSION
    ) {
      return res.status(409).json({
        code: "OG-REPLAY-VERSION-MISMATCH",
        error: "Replay requires the original policy and engine versions.",
        original: {
          policyVersion: original.policyVersion,
          engineVersion: original.engineVersion,
        },
        current: {
          policyVersion: policy.version,
          engineVersion: ENGINE_VERSION,
        },
      });
    }

    const replayed = evaluateAction(
      {
        action: original.action,
        operatingContext: original.operatingContext,
        actorRole: original.actorRole,
        requestedAuthority: original.requestedAuthority,
        requiresApproval: original.requiresApproval,
        previousState: original.previousState,
      },
      policy
    );

    return res.json({
      id: original.id,
      policyVersion: policy.version,
      engineVersion: ENGINE_VERSION,
      original: {
        decision: original.decision,
        authorityMode: original.authorityMode,
        executionOutcome: original.executionOutcome,
        resultingState: original.resultingState,
        stateAdmissibility: original.stateAdmissibility,
      },
      replayed: {
        decision: replayed.decision,
        authorityMode: replayed.authorityMode,
        executionOutcome: replayed.executionOutcome,
        resultingState: replayed.resultingState,
        stateAdmissibility: replayed.stateAdmissibility,
      },
      decisionMatches: original.decision === replayed.decision,
      authorityMatches: original.authorityMode === replayed.authorityMode,
      executionOutcomeMatches: original.executionOutcome === replayed.executionOutcome,
      stateTransitionMatches:
        statesMatch(original.resultingState, replayed.resultingState) &&
        original.stateAdmissibility === replayed.stateAdmissibility,
    });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    return res.status(500).json({
      code: "OG-INTERNAL-FAIL-CLOSED",
      error: "Orientation Gate could not complete the evaluation.",
      executionOutcome: "DENY",
      executorInvoked: false,
    });
  });

  return app;
}

export function startServer() {
  const app = createApp();
  return app.listen(PORT, () => {
    console.log(`Orientation Gate backend running on http://localhost:${PORT}`);
  });
}

const isMainModule =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  startServer();
}
