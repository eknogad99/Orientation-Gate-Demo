import { useState } from "react";

type DecisionResponse = {
    decision: string;
    reason: string;
    authorityMode?: string;
    authorityReason?: string;
    displacement: {
        temporal: string;
        system: string;
        energy: string;
    };
    confidence: number;
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

export default function App() {
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [decision, setDecision] = useState<DecisionResponse | null>(null);
    const [systemState, setSystemState] = useState("stable");
    const [authorityScenario, setAuthorityScenario] = useState<AuthorityScenario>("none");

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
        } catch {
            setDecision({
                decision: "ERROR",
                reason: "Failed to reach backend",
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
                    <h2>Pre-Execution Decision: {decision.decision}</h2>
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
        </div>
    );
}
