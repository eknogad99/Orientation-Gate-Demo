import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

type ExecutionOutcome = "EXECUTE" | "ESCALATE" | "DENY";
type StateAdmissibility = "STATE_ADMISSIBLE" | "STATE_AT_RISK" | "STATE_INADMISSIBLE";

type SystemModelState = {
  stability: number;
  configurationIntegrity: number;
  resourcePressure: number;
};

type EvaluationResponse = {
  id?: string;
  executionOutcome?: ExecutionOutcome;
  resultingState?: SystemModelState;
  stateAdmissibility?: StateAdmissibility;
};

type ReplayResponse = {
  original?: {
    executionOutcome?: ExecutionOutcome;
    resultingState?: SystemModelState;
    stateAdmissibility?: StateAdmissibility;
  };
  replayed?: {
    executionOutcome?: ExecutionOutcome;
    resultingState?: SystemModelState;
    stateAdmissibility?: StateAdmissibility;
  };
  executionOutcomeMatches?: boolean;
  stateTransitionMatches?: boolean;
};

const VERIFY_PORT = Number(process.env.ORIENTATION_GATE_VERIFY_PORT ?? 3101);
const BASE_URL = `http://localhost:${VERIFY_PORT}`;

function startServer(): Promise<ChildProcessWithoutNullStreams> {
  return new Promise((resolve, reject) => {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

    const server = spawn(npmCommand, ["run", "dev"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(VERIFY_PORT),
      },
      shell: process.platform === "win32",
    });

    let resolved = false;

    server.stdout.on("data", (data: Buffer) => {
      const output = data.toString();
      process.stdout.write(output);

      if (!resolved && output.includes(`http://localhost:${VERIFY_PORT}`)) {
        resolved = true;
        resolve(server);
      }
    });

    server.stderr.on("data", (data: Buffer) => {
      process.stderr.write(data.toString());
    });

    server.on("error", reject);

    server.on("exit", (code) => {
      if (!resolved) {
        reject(new Error(`Server exited before verification started with code ${String(code)}.`));
      }
    });
  });
}

function stopServer(server: ChildProcessWithoutNullStreams) {
  if (!server.killed) {
    server.kill();
  }
}

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

  if (replay.original?.stateAdmissibility === undefined) {
    throw new Error("Expected original.stateAdmissibility to be returned.");
  }

  if (replay.replayed?.stateAdmissibility === undefined) {
    throw new Error("Expected replayed.stateAdmissibility to be returned.");
  }

  if (replay.stateTransitionMatches !== true) {
    throw new Error(
      `Expected stateTransitionMatches to be true, received ${String(
        replay.stateTransitionMatches
      )}`
    );
  }
}

async function verifyContract() {
  const evaluation = await postJson<EvaluationResponse>("/evaluate", {
    action: "deploy_update",
    systemState: "drift",
    actorRole: "operator",
    requestedAuthority: "deploy",
    requiresApproval: false,
    previousState: {
      stability: 1,
      configurationIntegrity: 1,
      resourcePressure: 0,
    },
  });

  console.log("Evaluation response:", JSON.stringify(evaluation));

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

  if (evaluation.resultingState === undefined) {
    throw new Error("Expected /evaluate to return resultingState.");
  }

  if (evaluation.stateAdmissibility === undefined) {
    throw new Error("Expected /evaluate to return stateAdmissibility.");
  }

  const replay = await postJson<ReplayResponse>(`/replay/${encodeURIComponent(evaluation.id)}`);
  console.log("Replay response:", JSON.stringify(replay));
  assertReplayContract(replay);
}

async function main() {
  const server = await startServer();

  try {
    await verifyContract();
    console.log("Replay execution outcome and state transition contract verified.");
  } finally {
    stopServer(server);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});