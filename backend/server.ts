import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const LOGS_FILE = path.join(process.cwd(), "logs.json");
console.log("LOGS FILE PATH:", LOGS_FILE);

app.use(cors());
app.use(express.json());

type LogEvent = {
  id: string;
  timestamp: string;
  title: string;
  source: string;
  score: number;
  level: string;
  explanation: string;
};

function loadLogsFromFile(): LogEvent[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const fileContents = fs.readFileSync(LOGS_FILE, "utf-8");
      const parsed = JSON.parse(fileContents);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to load logs from file:", error);
  }

  return [
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
      explanation: "Adaptive mode applied moderate confidence.",
    },
    {
      id: "3",
      timestamp: "2026-03-29 14:07",
      title: "Deviation detected",
      source: "Input Scanner",
      score: 30,
      level: "warn",
      explanation: "No alignment terms found.",
    },
  ];
}

function saveLogsToFile(logs: LogEvent[]) {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save logs to file:", error);
  }
}

let logs: LogEvent[] = loadLogsFromFile(); 
saveLogsToFile(logs);

app.get("/", (_req: Request, res: Response) => {
  res.send("AOAL backend alive + summary");
});

app.post("/evaluate", (req: Request, res: Response) => {
  console.log("EVALUATE ROUTE HIT");

  const input: string = (req.body.input || "").toLowerCase();
  const mode: string = (req.body.mode || "strict").toLowerCase();

  const hasPolicy = input.includes("policy");
  const hasAligned = input.includes("aligned");
  const aligned = hasPolicy || hasAligned;

  let priority = 0;
  let explanation = "";

  if (mode === "adaptive") {
    if (aligned) {
      priority = 75;
      explanation = hasPolicy
        ? "Matched policy keyword. Adaptive mode applied moderate confidence."
        : "Matched aligned keyword. Adaptive mode applied moderate confidence.";
    } else {
      priority = 45;
      explanation =
        "No alignment terms found. Adaptive mode reduced severity of deviation.";
    }
  } else {
    if (aligned) {
      priority = 90;
      explanation = hasPolicy
        ? "Matched policy keyword. Strict mode applied high confidence."
        : "Matched aligned keyword. Strict mode applied high confidence.";
    } else {
      priority = 30;
      explanation =
        "No alignment terms found. Strict mode applied stronger deviation penalty.";
    }
  }

  const result = aligned
    ? `🟢 ALIGNED | Confidence: ${priority}% | Mode: ${mode}`
    : `🔴 DEVIATION | Confidence: ${priority}% | Mode: ${mode}`;

  let level = "info";
  if (priority >= 85) {
    level = "critical";
  } else if (priority >= 70) {
    level = "alert";
  } else if (priority >= 40) {
    level = "warn";
  }

  const title = aligned ? "Aligned input evaluated" : "Deviation detected";

  const newLog: LogEvent = {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString(),
    title,
    source: "Evaluation Engine",
    score: priority,
    level,
    explanation,
  };

  logs.unshift(newLog);
  console.log("ABOUT TO SAVE LOGS");
  saveLogsToFile(logs);
  console.log("SAVED LOGS TO FILE");
  console.log("NEW LOG ADDED:", newLog);
  console.log("LOG COUNT:", logs.length);

  res.json({ result, priority, explanation });
});

app.get("/summary", (_req: Request, res: Response) => {
  const topEvent = [...logs].sort((a, b) => b.score - a.score)[0];

  const summary = {
    topPriorityTitle: topEvent?.title ?? "No events",
    topPriorityScore: topEvent?.score ?? 0,
    topPrioritySource: topEvent?.source ?? "Unknown",
    topPrioritySourceReason:
      topEvent?.explanation ?? "No explanation available",
    totalEvents: logs.length,
    totalAlerts: logs.filter(
      (log) => log.level === "alert" || log.level === "critical"
    ).length,
  };

  res.json(summary);
});

app.get("/logs", (_req: Request, res: Response) => {
  res.json(logs);
});

app.listen(3001, () => {
  console.log("AOAL backend running on http://localhost:3001");
});