type ExecutionOutcome = "EXECUTE" | "ESCALATE" | "DENY";

type EvaluationResponse = {
  id?: string;
  executionOutcome?: ExecutionOutcome;
};

type ReplayResponse = {
  original?: {
    executionOutcome?: ExecutionOutcome;
  };
  replayed?: {
    executionOutcome?: ExecutionOutcome;
  };
  executionOutcomeMatches?: boolean;
};

const BASE_URL = process.env.ORIENTATION_GATE_URL ?? "http://localhost:3001";

async function postJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload as TResponse;
}

function assertReplayContract(replay: ReplayResponse) {
  if (replay.original?.executionOutcome !== "DENY") {
    throw new Error(
      `Expected original.executionOutcome to be DENY, received ${String(
        replay.original?.executionOutcome
      )}`
    );
  }

  if (replay.replayed?.executionOutcome !== "DENY") {
    throw new Error(
      `Expected replayed.executionOutcome to be DENY, received ${String(
        replay.replayed?.executionOutcome
      )}`
    );
  }

  if (replay.executionOutcomeMatches !== true) {
    throw new Error(
      `Expected executionOutcomeMatches to be true, received ${String(
        replay.executionOutcomeMatches
      )}`
    );
  }
}

async function main() {
  const evaluation = await postJson<EvaluationResponse>("/evaluate", {
    action: "deploy_update",
    systemState: "drift",
    actorRole: "operator",
    requestedAuthority: "deploy",
    requiresApproval: false,
  });

  if (!evaluation.id) {
    throw new Error("Expected /evaluate to return an id.");
  }

  if (evaluation.executionOutcome !== "DENY") {
    throw new Error(
      `Expected /evaluate executionOutcome to be DENY, received ${String(
        evaluation.executionOutcome
      )}`
    );
  }

  const replay = await postJson<ReplayResponse>(`/replay/${encodeURIComponent(evaluation.id)}`);
  assertReplayContract(replay);

  console.log("Replay execution outcome contract verified.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
