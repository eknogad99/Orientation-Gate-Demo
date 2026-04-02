import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const LOGS_FILE = path.join(process.cwd(), "logs.json");
const POLICY_FILE = path.join(process.cwd(), "policy.json");

console.log("LOGS FILE PATH:", LOGS_FILE);
console.log("POLICY FILE PATH:", POLICY_FILE);

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

type PolicyRule = {
  name: string;
  keywords: string[];
  priority_strict: number;
  priority_adaptive: number;
  level: string;
  action?: string;
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

function loadPolicy(): PolicyRule[] {
  try {
    if (fs.existsSync(POLICY_FILE)) {
      const fileContents = fs.readFileSync(POLICY_FILE, "utf-8");
      const parsed = JSON.parse(fileContents);

      if (parsed.rules && Array.isArray(parsed.rules)) {
        return parsed.rules;
      }
    }
  } catch (error) {
    console.error("Failed to load policy file:", error);
  }

  return [];
}

let logs: LogEvent[] = loadLogsFromFile();
saveLogsToFile(logs);

let policyRules: PolicyRule[] = loadPolicy();

app.get("/", (_req: Request, res: Response) => {
  res.send("AOAL backend alive + summary");
});

app.post("/evaluate", (req: Request, res: Response) => {
  console.log("EVALUATE ROUTE HIT");

  const input: string = (req.body.input || "").toLowerCase();
  const mode: string = (req.body.mode || "strict").toLowerCase();

  let matchedRule: PolicyRule | null = null;

  for (const rule of policyRules) {
    for (const keyword of rule.keywords) {
      if (input.includes(keyword.toLowerCase())) {
        matchedRule = rule;
        break;
      }
    }
    if (matchedRule) break;
  }

  let priority = 20;
  let explanation = "No policy rule matched. Review may be needed.";
  let level = "warn";
  let title = "No Rule Match";

  if (matchedRule) {
    priority =
      mode === "adaptive"
        ? matchedRule.priority_adaptive
        : matchedRule.priority_strict;

    explanation = matchedRule.explanation;
    level = matchedRule.level;
    title = matchedRule.name;
  }
let decision = "ALLOW";

if (!matchedRule) {
  decision = "WARN";
} else if (matchedRule.action) {
  decision = matchedRule.action.toUpperCase();
} else if (priority >= 70) {
  decision = "BLOCK";
} else if (priority >= 40) {
  decision = "WARN";
}
  console.log("MATCHED RULE:", matchedRule);
  const result = `${decision} | Score: ${priority} | Mode: ${mode}`;

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

  res.json({ result, priority, explanation, decision });
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

app.get("/status", (_req: Request, res: Response) => {
  let status = "NORMAL";

  const hasBlock = logs.some((log) => log.level === "critical");
  const hasAlert = logs.some((log) => log.level === "alert");

  if (hasBlock) {
    status = "CRITICAL";
  } else if (hasAlert) {
    status = "ALERT";
  }

  res.json({ status });
});

app.get("/logs", (_req: Request, res: Response) => {
  res.json(logs);
});

app.get("/export-logs", (_req: Request, res: Response) => {
  try {
    res.download(LOGS_FILE, "aoal-logs.json");
  } catch (error) {
    console.error("Failed to export logs:", error);
    res.status(500).json({ error: "Failed to export logs" });
  }
});

app.get("/policy", (_req: Request, res: Response) => {
  res.json(policyRules);
});

app.post("/policy", (req: Request, res: Response) => {
  try {
    const newRules = req.body;

    fs.writeFileSync(
      POLICY_FILE,
      JSON.stringify({ rules: newRules }, null, 2),
      "utf-8"
    );

    policyRules = loadPolicy();

    res.json({ status: "Policy updated" });
  } catch (error) {
    console.error("Failed to save policy:", error);
    res.status(500).json({ error: "Failed to save policy" });
  }
});

app.get("/incident-report", (_req: Request, res: Response) => {
  try {
    const topEvent = [...logs].sort((a, b) => b.score - a.score)[0];

    let status = "NORMAL";
    const hasCritical = logs.some((log) => log.level === "critical");
    const hasAlert = logs.some((log) => log.level === "alert");

    if (hasCritical) {
      status = "CRITICAL";
    } else if (hasAlert) {
      status = "ALERT";
    }

    const totalEvents = logs.length;
    const totalAlerts = logs.filter(
      (log) => log.level === "alert" || log.level === "critical"
    ).length;

    const recentEvents = logs.slice(0, 5);

    const report = `
AOAL INCIDENT REPORT
====================

Generated: ${new Date().toLocaleString()}

System Status: ${status}

Top Priority Event:
- Title: ${topEvent?.title ?? "None"}
- Score: ${topEvent?.score ?? 0}
- Source: ${topEvent?.source ?? "Unknown"}
- Explanation: ${topEvent?.explanation ?? "No explanation available"}

Totals:
- Total Events: ${totalEvents}
- Total Alerts: ${totalAlerts}

Recent Events:
${recentEvents
  .map(
    (log, index) => `${index + 1}. [${log.timestamp}] ${log.title}
   Score: ${log.score}
   Level: ${log.level}
   Source: ${log.source}
   Explanation: ${log.explanation}`
  )
  .join("\n\n")}
`.trim();

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", 'attachment; filename="aoal-incident-report.txt"');
    res.send(report);
  } catch (error) {
    console.error("Failed to generate incident report:", error);
    res.status(500).json({ error: "Failed to generate incident report" });
  }
});

app.listen(3001, () => {
  console.log("AOAL backend running on http://localhost:3001");
});