import { useState } from "react";

type DecisionResponse = {
    decision: string;
    reason: string;
    displacement: {
        temporal: string;
        system: string;
        energy: string;
    };
    confidence: number;
};

export default function App() {
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [decision, setDecision] = useState<DecisionResponse | null>(null);
    const [systemState, setSystemState] = useState("stable");

    const handleAction = async (action: string) => {
        try {
            setIsEvaluating(true);
            setDecision(null);

            await new Promise((resolve) => setTimeout(resolve, 1200));

            const response = await fetch("http://localhost:3001/evaluate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action, systemState }),
            });

            const data = await response.json();
            setDecision(data);
        } catch (error) {
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
        <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
            <h1>Orientation Gate Demo</h1>
            <p>Pre-Execution Decision Layer</p>

            <div style={{ marginBottom: "1rem" }}>
                <label>System State: </label>
                <select
                    value={systemState}
                    onChange={(e) => setSystemState(e.target.value)}
                >
                    <option value="stable">Stable</option>
                    <option value="drift">Under Drift</option>
                </select>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                    flexWrap: "wrap",
                }}
            >
                <button onClick={() => handleAction("Safe Read Operation")}>
                    Safe Read Operation
                </button>

                <button onClick={() => handleAction("Config Change with Drift Risk")}>
                    Config Change with Drift Risk
                </button>

                <button onClick={() => handleAction("Deploy Code Update")}>
                    Deploy Code Update
                </button>
            </div>

            {isEvaluating && (
                <div
                    style={{
                        border: "1px solid #ccc",
                        padding: "1rem",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                        fontWeight: "bold",
                    }}
                >
                    Evaluating pre-execution risk...
                </div>
            )}

            {decision && (
                <div
                    style={{
                        border: "1px solid #ccc",
                        padding: "1rem",
                        borderRadius: "8px",
                    }}
                >
                    <h2>Pre-Execution Decision: {decision.decision}</h2>
                    <p><strong>Reason:</strong> {decision.reason}</p>

                    <div style={{ marginTop: "1rem" }}>
                        <strong>Displacement:</strong>
                        <div>Temporal: {decision.displacement.temporal}</div>
                        <div>System: {decision.displacement.system}</div>
                        <div>Energy: {decision.displacement.energy}</div>
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                        <strong>Confidence:</strong> {decision.confidence}
                    </div>
                </div>
            )}
        </div>
    );
}


