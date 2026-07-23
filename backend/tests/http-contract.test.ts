import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import test from "node:test";
import type { EvidenceEntry, EvidenceStore } from "../evidence-store.ts";
import { createApp } from "../server.ts";
import { loadPolicy } from "../policy.ts";

class MemoryEvidenceStore implements EvidenceStore {
  entries: EvidenceEntry[] = [];

  list() {
    return [...this.entries];
  }

  find(id: string) {
    return this.entries.find((entry) => entry.id === id);
  }

  append(entry: EvidenceEntry) {
    this.entries.unshift(entry);
  }
}

const validRequest = {
  action: "safe_read",
  operatingContext: "stable",
  actorRole: null,
  requestedAuthority: null,
  requiresApproval: false,
  previousState: {
    stability: 1,
    configurationIntegrity: 1,
    resourcePressure: 0,
  },
};

async function withServer<T>(
  store: MemoryEvidenceStore,
  policy: ReturnType<typeof loadPolicy>,
  run: (baseUrl: string) => Promise<T>
) {
  const server = createApp({ evidenceStore: store, policy }).listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test("HTTP boundary fails invalid execution requests closed", async () => {
  const store = new MemoryEvidenceStore();
  await withServer(store, loadPolicy(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/execute-demo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "unknown" }),
    });
    const payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.code, "OG-INVALID-REQUEST");
    assert.equal(payload.executionOutcome, "DENY");
    assert.equal(payload.executorInvoked, false);
    assert.equal(store.entries.length, 0);
  });
});

test("HTTP execution proof records and replays an EXECUTE result", async () => {
  const store = new MemoryEvidenceStore();
  await withServer(store, loadPolicy(), async (baseUrl) => {
    const executionResponse = await fetch(`${baseUrl}/execute-demo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validRequest),
    });
    const execution = await executionResponse.json();
    assert.equal(executionResponse.status, 200);
    assert.equal(execution.evaluation.executionOutcome, "EXECUTE");
    assert.equal(execution.executorInvoked, true);
    assert.equal(store.entries.length, 1);

    const replayResponse = await fetch(
      `${baseUrl}/replay/${encodeURIComponent(execution.evaluation.id)}`,
      { method: "POST" }
    );
    const replay = await replayResponse.json();
    assert.equal(replayResponse.status, 200);
    assert.equal(replay.decisionMatches, true);
    assert.equal(replay.authorityMatches, true);
    assert.equal(replay.executionOutcomeMatches, true);
    assert.equal(replay.stateTransitionMatches, true);
  });
});

test("replay refuses a policy version mismatch", async () => {
  const store = new MemoryEvidenceStore();
  const originalPolicy = loadPolicy();
  let evaluationId = "";

  await withServer(store, originalPolicy, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validRequest),
    });
    const evaluation = await response.json();
    evaluationId = evaluation.id;
  });

  await withServer(
    store,
    { ...originalPolicy, version: "different-policy-version" },
    async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/replay/${encodeURIComponent(evaluationId)}`,
        { method: "POST" }
      );
      const payload = await response.json();
      assert.equal(response.status, 409);
      assert.equal(payload.code, "OG-REPLAY-VERSION-MISMATCH");
    }
  );
});
