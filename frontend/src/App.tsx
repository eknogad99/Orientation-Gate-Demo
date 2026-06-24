import { useState } from "react";

type ExecutionOutcome = "EXECUTE" | "ESCALATE" | "DENY";

type DecisionResponse = {
    id?: string;
    decision: string;
    reason: string;
    authorityMode?: string;
    authorityReason?: string;
    executionOutcome?: ExecutionOutcome;
    displacement: {
        temporal: string;
        system: string;
        energy: string;
    };
    confidence: number;
};

type ReplayResponse = {
    id?: string;
    original?: {
        decision: string;
        authorityMode?: string;
        executionOutcome?: ExecutionOutcome;
    };
    replayed?: {
        decision: string;
        authorityMode?: string;
        executionOutcome?: ExecutionOutcome;
    };
    decisionMatches?: boolean;
    authorityMatches?: boolean;
    executionOutcomeMatches?: boolean;
    error?: string;
};

type AuthorityScenario = "none" | "approval" | "exceeds";

function getAuthorityFields(authorityScenario: AuthorityScenario) {
    if (authorityScenario === "approval") {
        return {
            actorRole: "maintainer",
            requestedAuthority: "configure",
            requiresApproval: true,
        };
    }

    if (authorityScenario === "exceeds") {
        return {
            actorRole: "operator",
            requestedAuthority: "deploy",
        };
    }

    return {};
}

function MatchIndicator({ matches }: { matches?: boolean }) {
    const label = matches ? "Match" : "Mismatch";

    return (
        <span
            style={{
                display: "inline-block",
                marginLeft: "0.5rem",
                padding: "0.15rem 0.5rem",
                borderRadius: "999px",
                background: matches ? "#14532d" : "#7f1d1d",
                color: matches ? "#bbf7d0" : "#fecaca",
                fontWeight: "bold",
            }}
        >
            {matches ? "OK" : "!"} {label}
        </span>
    );
}

function getExecutionOutcomeStyles(executionOutcome?: ExecutionOutcome) {
    if (executionOutcome === "EXECUTE") {
        return {
            border: "2px solid #22c55e",
            background: "#052e16",
            color: "#bbf7d0",
        };
    }

    if (executionOutcome === "ESCALATE") {
        return {
            border: "2px solid #f59e0b",
            background: "#451a03",
            color: "#fde68a",
        };
    }

    return {
        border: "2px solid #ef4444",
        background: "#450a0a",
        color: "#fecaca",
    };
}

function resolveExecutionOutcome(decision?: string, authorityMode?: string): ExecutionOutcome | undefined {
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

    if (decision === "ALLOW") {
        return "EXECUTE";
    }

    return undefined;
}

export default function App() {
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [decision, setDecision] = useState<DecisionResponse | null>(null);
    const [systemState, setSystemState] = useState("stable");
    const [authorityScenario, setAuthorityScenario] = useState<AuthorityScenario>("none");
    const [replayId, setReplayId] = useState("");
    const [isReplaying, setIsReplaying] = useState(false);
    const [replayResult, setReplayResult] = useState<ReplayResponse | null>(null);

    const originalReplayExecutionOutcome =
        replayResult?.original?.executionOutcome ??
        resolveExecutionOutcome(replayResult?.original?.decision, replayResult?.original?.authorityMode);
    const replayedReplayExecutionOutcome =
        replayResult?.replayed?.executionOutcome ??
        resolveExecutionOutcome(replayResult?.replayed?.decision, replayResult?.replayed?.authorityMode);
    const replayExecutionOutcomeMatches =
        replayResult?.executionOutcomeMatches ??
        (originalReplayExecutionOutcome !== undefined && replayedReplayExecutionOutcome !== undefined
            ? originalReplayExecutionOutcome === replayedReplayExecutionOutcome
            : undefined);

    const handleAction = async (action: string) => {
        try {
            setIsEvaluating(true);
            setDecision(null);
            const authorityFields = getAuthorityFields(authorityScenario);

            const response = await fetch("http://localhost:3001/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action, systemState, ...authorityFields }),
            });

            const data = await response.json();
            setDecision(data);
            if (data.id) {
                setReplayId(data.id);
            }
            setReplayResult(null);
        } catch {
            setDecision({
                decision: "ERROR",
                reason: "Failed to reach backend",
                executionOutcome: "DENY",
                displacement: {
                    temporal: "UNKNOWN",
                    system: "UNKNOWN",
                    energy: "UNKNOWN",
                },
                confidence: 0,
            });
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleReplay = async (idOverride?: string) => {
        const idToReplay = idOverride ?? replayId.trim();

        if (!idToReplay) {
            setReplayResult({ error: "Enter an evaluation id to replay." });
            return;
        }

        try {
            setIsReplaying(true);
            setReplayResult(null);

            const response = await fetch(`http://localhost:3001/replay/${encodeURIComponent(idToReplay)}`, {
                method: "POST",
            });

            const data = await response.json();
            setReplayResult(data);
        } catch {
            setReplayResult({ error: "Failed to replay evaluation." });
        } finally {
            setIsReplaying(false);
        }
    };

    return (
        <div
            style={{
                padding: "2rem",
                fontFamily: "Arial, sans-serif",
                maxWidth: "900px",
                margin: "0 auto",
                background: "#0b1020",
                color: "white",
                minHeight: "100vh",
            }}
        >
            <h1>Orientation Gate Demo</h1>
            <p>Pre-Execution Decision Layer</p>

            <div style={{ marginBottom: "1rem" }}>
                <label>System State: </label>
                <select value={systemState} onChange={(e) => setSystemState(e.target.value)}>
                    <option value="stable">Stable</option>
                    <option value="drift">Under Drift</option>
                </select>
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <label>Authority Scenario: </label>
                <select
                    value={authorityScenario}
                    onChange={(e) => setAuthorityScenario(e.target.value as AuthorityScenario)}
                >
                    <option value="none">No Escalation</option>
                    <option value="approval">Requires Approval</option>
                    <option value="exceeds">Exceeds Authority</option>
                </select>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <button onClick={() => handleAction("safe_read")}>Safe Read Operation</button>
                <button onClick={() => handleAction("config_change")}>Config Change</button>
                <button onClick={() => handleAction("deploy_update")}>Deploy Code Update</button>
            </div>

            {isEvaluating && (
                <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", fontWeight: "bold" }}>
                    Evaluating pre-execution risk...
                </div>
            )}

            {decision && (
                <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
                    <div
                        style={{
                            ...getExecutionOutcomeStyles(decision.executionOutcome),
                            padding: "1rem",
                            borderRadius: "10px",
                            marginBottom: "1rem",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: "0.85rem", fontWeight: "bold", letterSpacing: "0.12em" }}>
                            EXECUTION RESULT
                        </div>
                        <div style={{ fontSize: "2.75rem", fontWeight: "bold", marginTop: "0.25rem" }}>
                            {decision.executionOutcome ?? "DENY"}
                        </div>
                    </div>

                    <h2>Pre-Execution Decision: {decision.decision}</h2>
                    {decision.id && (
                        <div
                            style={{
                                border: "1px solid #38bdf8",
                                background: "#082f49",
                                color: "#e0f2fe",
                                padding: "0.75rem",
                                borderRadius: "8px",
                                marginBottom: "1rem",
                            }}
                        >
                            <strong>Evaluation ID:</strong>
                            <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginTop: "0.25rem", wordBreak: "break-all" }}>
                                {decision.id}
                            </div>
                        </div>
                    )}
                    <p><strong>Reason:</strong> {decision.reason}</p>

                    <div style={{ marginTop: "1rem" }}>
                        <strong>Displacement:</strong>
                        <div>Temporal: {decision.displacement.temporal}</div>
                        <div>System: {decision.displacement.system}</div>
                        <div>Energy: {decision.displacement.energy}</div>
                    </div>

                    <p><strong>Confidence:</strong> {decision.confidence}</p>

                    {(decision.authorityMode || decision.authorityReason) && (
                        <div style={{ marginTop: "1rem" }}>
                            <h3>Authority Layer</h3>
                            {decision.authorityMode && (
                                <p><strong>authorityMode:</strong> {decision.authorityMode}</p>
                            )}
                            {decision.authorityReason && (
                                <p><strong>authorityReason:</strong> {decision.authorityReason}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px", marginTop: "1rem" }}>
                <h2>Replay Verification</h2>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <input
                        value={replayId}
                        onChange={(e) => setReplayId(e.target.value)}
                        placeholder="Evaluation ID"
                        style={{ flex: "1 1 260px" }}
                    />
                    <button onClick={() => handleReplay()} disabled={isReplaying}>
                        {isReplaying ? "Replaying..." : "Replay"}
                    </button>
                    <button onClick={() => handleReplay(decision?.id)} disabled={isReplaying || !decision?.id}>
                        Replay Latest Evaluation
                    </button>
                </div>

                {replayResult && (
                    <div style={{ marginTop: "1rem" }}>
                        {replayResult.error ? (
                            <p><strong>Error:</strong> {replayResult.error}</p>
                        ) : (
                            <>
                                <p><strong>Original Decision:</strong> {replayResult.original?.decision}</p>
                                <p><strong>Replayed Decision:</strong> {replayResult.replayed?.decision}</p>
                                <p>
                                    <strong>Decision Match:</strong> {String(replayResult.decisionMatches)}
                                    <MatchIndicator matches={replayResult.decisionMatches} />
                                </p>
                                <p><strong>Original Authority Mode:</strong> {replayResult.original?.authorityMode}</p>
                                <p><strong>Replayed Authority Mode:</strong> {replayResult.replayed?.authorityMode}</p>
                                <p>
                                    <strong>Authority Match:</strong> {String(replayResult.authorityMatches)}
                                    <MatchIndicator matches={replayResult.authorityMatches} />
                                </p>
                                <p><strong>Original Execution Outcome:</strong> {originalReplayExecutionOutcome}</p>
                                <p><strong>Replayed Execution Outcome:</strong> {replayedReplayExecutionOutcome}</p>
                                <p>
                                    <strong>Execution Outcome Match:</strong> {String(replayExecutionOutcomeMatches)}
                                    <MatchIndicator matches={replayExecutionOutcomeMatches} />
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
