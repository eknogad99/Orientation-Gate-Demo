import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
res.send("AOAL backend alive + summary test");  
});

app.post("/evaluate", (req: Request, res: Response) => {
  const input: string = (req.body.input || "").toLowerCase();
  const mode: string = (req.body.mode || "strict").toLowerCase();

  const hasPolicy = input.includes("policy");
  const hasAligned = input.includes("aligned");
  const aligned = hasPolicy || hasAligned;

  let priority: number;
  let explanation: string;

  if (mode === "adaptive") {
    if (aligned) {
      priority = 75;
      explanation = hasPolicy
        ? "Matched policy keyword. Adaptive mode applied moderate confidence."
        : "Matched aligned keyword. Adaptive mode applied moderate confidence.";
    } else {
      priority = 45;
      explanation = "No alignment terms found. Adaptive mode reduced severity of deviation.";
    }
  } else {
    if (aligned) {
      priority = 90;
      explanation = hasPolicy
        ? "Matched policy keyword. Strict mode applied high confidence."
        : "Matched aligned keyword. Strict mode applied high confidence.";
    } else {
      priority = 30;
      explanation = "No alignment terms found. Strict mode applied stronger deviation penalty.";
    }
  }

  const result = aligned
    ? `🟢 ALIGNED | Confidence: ${priority}% | Mode: ${mode}`
    : `🔴 DEVIATION | Confidence: ${priority}% | Mode: ${mode}`;

  res.json({ result, priority, explanation });
});

app.get("/summary", (_req: Request, res: Response) => {
  const summary = {
    topPriorityTitle: "Policy Threshold Breach",
    topPriorityScore: 91,
    topPrioritySource: "Rule Engine",
    topPrioritySourceReason: "Score exceeded critical threshold",
    totalEvents: 12,
    totalAlerts: 3,
  };

  res.json(summary);
});

app.get("/logs", (_req: Request, res: Response) => {
  const logs = [
    {
      id: "1",
      timestamp: "2026-03-29 14:02",
      title: "Policy keyword matched",
      source: "Rule Engine",
      score: 91,
      level: "critical",
      explanation: "Score exceeded critical threshold",
    },
    {
      id: "2",
      timestamp: "2026-03-29 14:05",
      title: "Adaptive review triggered",
      source: "Evaluation Engine",
      score: 75,
      level: "alert",
      explanation: "Adaptive mode applied moderate confidence",
    },
    {
      id: "3",
      timestamp: "2026-03-29 14:07",
      title: "Deviation detected",
      source: "Input Scanner",
      score: 30,
      level: "warn",
      explanation: "No alignment terms found",
    },
  ];

  res.json(logs);
});

app.listen(3001, () => {
  console.log("AOAL backend running on http://localhost:3001");
});