import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div style="max-width: 1200px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif;">
  <h1>Orientation Gate Dashboard</h1>
  <p style="color:#bbb;">
    Orientation Gate evaluates proposed actions before execution and determines whether they should be allowed, warned, or blocked.
  </p>

  <div style="display:flex; gap:12px; margin-top:12px;">
    <div id="evaluate-panel" style="flex:1; padding:16px; border:1px solid #444; border-radius:8px;">
      <h2 style="margin-top:0;color:#8ec5ff;">Proposed Action</h2>

      <label><strong>Action</strong></label>
      <textarea id="aoal-input" rows="4" style="width:100%; margin-top:8px; padding:8px;"></textarea>

      <div style="margin-top:12px;">
        <label><strong>Mode</strong></label><br/>
        <select id="aoal-mode" style="margin-top:8px; padding:8px;">
          <option value="strict">strict</option>
          <option value="adaptive">adaptive</option>
        </select>
      </div>

      <div style="margin-top:12px;">
  <button id="evaluate-button" type="button">
    Evaluate Action
  </button>

  <button id="export-button" type="button">
    Export Audit Logs
  </button>

  <button id="incident-report-button" type="button">
    Generate Incident Report
  </button>
</div>
      <div style="margin-top:12px;">
        <button id="scenario-alignment">Alignment Scenario</button>
        <button id="scenario-deviation">Deviation Scenario</button>
        <button id="scenario-mixed">Mixed Scenario</button>
        <button id="scenario-incident" type="button" style="padding:10px 16px; cursor:pointer;">
          Run Incident Scenario
        </button>
      </div>

      <div id="evaluate-result" style="margin-top:16px;">
        No evaluation yet.
      </div>
    </div>


    <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
      <div id="status" style="padding:16px; border:1px solid #444; border-radius:8px;">
        <h2 style="margin-top:0;color:#8ec5ff;">System Status</h2>
      </div>

      <div id="trend" style="padding:16px; border:1px solid #444; border-radius:8px;">
        <h2 style="margin-top:0;color:#8ec5ff;">Trend</h2>
      </div>

      <div id="summary" style="padding:16px; border:1px solid #444; border-radius:8px;">
        <h2 style="margin-top:0;color:#8ec5ff;">System Summary</h2>
      </div>
    </div>
  </div>

  <div id="timeline" style="padding:16px; border:1px solid #444; border-radius:8px; margin-top:12px;">
    <h2 style="margin-top:0;color:#8ec5ff;">Event Timeline</h2>
  </div>

  <div id="policy" style="padding:16px; border:1px solid #444; border-radius:8px; margin-top:12px;">
    <h2 style="margin-top:0;color:#8ec5ff;">Orientation Rules</h2>
  </div>

  <div id="architecture" style="padding:16px; border:1px solid #444; border-radius:8px; margin-top:12px;">
    <h2 style="margin-top:0;color:#8ec5ff;">Architecture</h2>
  </div>
</div>
`;

console.log("LoadSystemStatus running");
console.log("Loading System Status");
async function loadSystemStatus() {
  try {

    const res = await fetch("http://localhost:3001/status");
    const data = await res.json();

    const statusDiv = document.getElementById("status");

    if (!statusDiv) return;

    let color = "#4caf50";
    if (data.status === "ALERT") color = "#ffa500";
    if (data.status === "CRITICAL") color = "#ff4d4d";

    statusDiv.innerHTML = `
      <h2 style="margin-top:0;color:#8ec5ff;">System Status</h2>
      <p style="font-size:22px;font-weight:bold;color:${color};">
        ${data.status}
      </p>
    `;
  } catch (err) {
    console.error("Failed to load status", err);
  }
}
console.log("LoadTrend running");
console.log("Loading Trend");
async function loadTrend() {
  try {
    const res = await fetch("http://localhost:3001/trend");
    const data = await res.json();

    const trendDiv = document.getElementById("trend");
    if (!trendDiv) return;

    let color = "#aaa";
    if (data.trend === "RISING") color = "#ff4d4d";
    if (data.trend === "FALLING") color = "#4caf50";
    if (data.trend === "STABLE") color = "#ffa500";

    trendDiv.innerHTML = `
      <h3>Trend</h3>
      <p><strong>Rolling Average Score:</strong> ${data.rollingAverage}</p>
      <p><strong>Trend:</strong> 
        <span style="color:${color}; font-weight:bold;">
          ${data.trend}
        </span>
      </p>
    `;
  } catch (err) {
    console.error("Failed to load trend", err);
  }
}

console.log("LoadSystemSummary running");
console.log("Loading System Summary");
async function loadSystemSummary() {
  try {
    const res = await fetch("http://localhost:3001/summary");
    const data = await res.json();

    const summaryDiv = document.getElementById("summary");

    if (!summaryDiv) return;

    let scoreColor = "#aaa";
    if (data.topPriorityScore >= 85) {
      scoreColor = "#ff4d4d";
    } else if (data.topPriorityScore >= 70) {
      scoreColor = "#ffa500";
    } else if (data.topPriorityScore >= 40) {
      scoreColor = "#ffd700";
    }

    const now = new Date().toLocaleString();

    summaryDiv.innerHTML = `
      <h2 style="margin-top: 0; color: #8ec5ff;">System Summary</h2>
      <p><strong>Top Priority:</strong> ${data.topPriorityTitle}</p>
      <p><strong>Score:</strong> <span style="color:${scoreColor};">${data.topPriorityScore}</span></p>
      <p><strong>Primary Source:</strong> ${data.topPrioritySource}</p>
      <p><strong>Reason:</strong> ${data.topPrioritySourceReason}</p>
      <p><strong>Total Events:</strong> ${data.totalEvents}</p>
      <p><strong>Total Alerts:</strong> ${data.totalAlerts}</p>
      <p><em>Last updated: ${now}</em></p>
    `;
  } catch (err) {
    console.error("Failed to load summary", err);
  }
}

console.log("loadEventTimeline running");
console.log("Loading Event Timeline");
async function loadEventTimeline() {
  try {
    const res = await fetch("http://localhost:3001/logs");
    const logs = await res.json();

    const timelineDiv = document.getElementById("timeline");
    if (!timelineDiv) return;

    let html = `<h2 style="margin-top:0;color:#8ec5ff;">Event Timeline</h2>`;

    logs.slice(0, 10).forEach((log: any) => {
      html += `
        <div style="margin-bottom:12px;padding:8px;border:1px solid #333;border-radius:6px;">
          <p><strong>${log.title}</strong></p>
          <p>${log.timestamp}</p>
          <p>Score: ${log.score}</p>
          <p>Level: ${log.level}</p>
          <p>${log.explanation}</p>
        </div>
      `;
    });

    timelineDiv.innerHTML = html;
  } catch (err) {
    console.error("Failed to load timeline", err);
  }
}
console.log("loadOrientationRules running");
console.log("Loading Orientation Rules");
async function loadOrientationRules() {
  try {
    const res = await fetch("http://localhost:3001/policy");
    let rulesData = await res.json();

    const policyDiv = document.getElementById("policy");

    if (!policyDiv) return;

    function renderPolicyEditor() {
      let html = `<h2 style="margin-top:0;color:#8ec5ff;">Orientation Rules</h2>`;

      rulesData.forEach((rule: any, index: number) => {
        html += `
          <div style="margin-bottom:12px;padding:8px;border:1px solid #333;border-radius:6px;">
            <p><strong>Name:</strong><br/>
            <input id="rule-name-${index}" value="${rule.name ?? ""}" style="width:100%;" /></p>

            <p><strong>Keywords (comma separated):</strong><br/>
            <input id="rule-keywords-${index}" value="${(rule.keywords ?? []).join(", ")}" style="width:100%;" /></p>

            <p><strong>Strict Priority:</strong><br/>
            <input id="rule-strict-${index}" value="${rule.priority_strict ?? 50}" style="width:100%;" /></p>

            <p><strong>Adaptive Priority:</strong><br/>
            <input id="rule-adaptive-${index}" value="${rule.priority_adaptive ?? 50}" style="width:100%;" /></p>

            <p><strong>Level:</strong><br/>
            <input id="rule-level-${index}" value="${rule.level ?? "info"}" style="width:100%;" /></p>

            <p><strong>Action:</strong><br/>
            <input id="rule-action-${index}" value="${rule.action ?? ""}" style="width:100%;" /></p>

            <p><strong>Explanation:</strong><br/>
            <input id="rule-explanation-${index}" value="${rule.explanation ?? ""}" style="width:100%;" /></p>

            <button id="delete-rule-${index}" type="button" style="padding:8px 12px; margin-top:8px;">
              Delete Rule
            </button>
          </div>
        `;
      });

      html += `
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button id="add-rule-button" type="button" style="padding:10px 16px;">Add New Rule</button>
          <button id="save-policy-button" type="button" style="padding:10px 16px;">Save Policy</button>
        </div>
      `;

      policyDiv.innerHTML = html;

      const addButton = document.getElementById("add-rule-button");
      if (addButton) {
        addButton.addEventListener("click", () => {
          rulesData.push({
            name: "New Rule",
            keywords: [""],
            priority_strict: 50,
            priority_adaptive: 50,
            level: "info",
            action: "warn",
            explanation: "New rule explanation."
          });
          renderPolicyEditor();
        });
      }

      rulesData.forEach((_: any, index: number) => {
        const deleteButton = document.getElementById(`delete-rule-${index}`);
        if (deleteButton) {
          deleteButton.addEventListener("click", () => {
            rulesData.splice(index, 1);
            renderPolicyEditor();
          });
        }
      });

      const saveButton = document.getElementById("save-policy-button");
      if (saveButton) {
        saveButton.addEventListener("click", async () => {
          const updatedRules: any[] = [];

          rulesData.forEach((_: any, index: number) => {
            updatedRules.push({
              name: (document.getElementById(`rule-name-${index}`) as HTMLInputElement).value,
              keywords: (document.getElementById(`rule-keywords-${index}`) as HTMLInputElement).value
                .split(",")
                .map((k) => k.trim())
                .filter((k) => k.length > 0),
              priority_strict: Number((document.getElementById(`rule-strict-${index}`) as HTMLInputElement).value),
              priority_adaptive: Number((document.getElementById(`rule-adaptive-${index}`) as HTMLInputElement).value),
              level: (document.getElementById(`rule-level-${index}`) as HTMLInputElement).value,
              action: (document.getElementById(`rule-action-${index}`) as HTMLInputElement).value,
              explanation: (document.getElementById(`rule-explanation-${index}`) as HTMLInputElement).value
            });
          });

          await fetch("http://localhost:3001/policy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedRules)
          });

          alert("Policy saved.");
          loadPolicy();
        });
      }
    }

    renderPolicyEditor();
  } catch (err) {
    console.error("Failed to load policy", err);
  }
}
console.log("LoadArchitecture running")
console.log("Loading Architecture");
function loadArchitecture() {
  const architectureDiv = document.getElementById("architecture");
  if (!architectureDiv) return;

  architectureDiv.innerHTML = `
    <h2 style="margin-top:0;color:#8ec5ff;">Orientation Gate Architecture</h2>
    <pre style="white-space:pre-wrap; line-height:1.5;">
Proposed Action
      ↓
Orientation Gate
(Policy / Risk / Cost / Authority Checks)
      ↓
Allow | Warn | Block
      ↓
Execution Layer
      ↓
Logs / Timeline / Reports
    </pre>
  `;
}


async function evaluateInput() {
  const inputEl = document.getElementById("aoal-input") as HTMLTextAreaElement | null;
  const modeEl = document.getElementById("aoal-mode") as HTMLSelectElement | null;
  const resultDiv = document.getElementById("evaluate-result");
  const [isEvaluating, setIsEvaluating] = useState(false);

  if (!inputEl || !modeEl || !resultDiv) return;

  const input = inputEl.value.trim();
  const mode = modeEl.value;

  if (!input) {
    resultDiv.innerHTML = `<p><strong>Please enter a proposed action.</strong></p>`;
    return;
  }

  try {
    const res = await fetch("https://ventricle-visibly-tricky.ngrok-free.dev/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input, mode })
    });

    const data = await res.json();
    setDecision(data);
    setIsEvaluating(false);
  };

  { isEvaluating && <div>Evaluating pre - execution risk...</div> }

  {
    decision && (
      <div>
      <h3>Pre - Execution Decision: { decision.decision } </h3>
        < p > { decision.reason } </p>
        </div>
)
  }

  let decisionColor = "#aaa";
  if (data.decision === "BLOCK") decisionColor = "#ff4d4d";
  else if (data.decision === "WARN") decisionColor = "#ffa500";
  else if (data.decision === "ALLOW") decisionColor = "#4caf50";

  resultDiv.innerHTML = `
      <h3>Orientation Gate Decision</h3>
      <p><strong>Decision:</strong>
        <span style="color:${decisionColor}; font-weight:bold;">
          ${data.decision}
        </span>
      </p>
      <p><strong>Score:</strong> ${data.priority}</p>
      <p><strong>Explanation:</strong> ${data.explanation}</p>
    `;

  inputEl.value = "";

  await loadStatus();
  await loadTrend();
  await loadSystemSummary();
  await loadEventTimeline();
} catch (err) {
  console.error("Failed to evaluate input", err);
  resultDiv.innerHTML = `<p><strong>Evaluation failed.</strong></p>`;
}
}

async function runScenario(inputs: string[], mode: string, label: string) {
  const resultDiv = document.getElementById("evaluate-result");
  if (resultDiv) {
    resultDiv.innerHTML = `<p><strong>Running scenario:</strong> ${label}</p>`;
  }

  for (const input of inputs) {
    await runSingleEvaluation(input, mode);
  }

  if (resultDiv) {
    resultDiv.innerHTML = `<p><strong>Scenario completed:</strong> ${label}</p>`;

  }
  await loadStatus();
  await loadTrend();
  await loadSystemSummary();
  await loadEventTimeline();

}

async function loadStatus() {
  const statusDiv = document.getElementById("status");
  if (!statusDiv) return;

  statusDiv.innerHTML = `
    <h2 style="margin-top:0;color:#8ec5ff;">System Status</h2>
    <p style="color:#ff4d4d;"><strong>CRITICAL</strong></p>
    <p>Orientation risk detected in recent evaluations.</p>
  `;
}

function generateIncidentReport() {
  const report = `
INCIDENT REPORT
--------------------------
System: Orientation Gate
Date: ${new Date().toLocaleString()}

Summary:
A sequence of actions triggered multiple policy violations.
Orientation Gate blocked high-risk actions and logged all events.

System Behavior:
- Evaluated proposed actions
- Applied policy rules
- Blocked unsafe operations
- Logged events
- Updated timeline and summary

Outcome:
System prevented execution of misaligned actions and maintained operational integrity.
`;

  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "incident-report.txt";
  a.click();

  URL.revokeObjectURL(url);
}


function exportLogs() {
  window.open("http://localhost:3001/export-logs", "_blank");
}

loadStatus();
loadTrend();
loadSystemSummary();
loadEventTimeline();
loadOrientationRules();
loadArchitecture();


const evaluateButton = document.getElementById("evaluate-button");
console.log("evaluate button found:", evaluateButton);

if (evaluateButton) {
  evaluateButton.addEventListener("click", evaluateInput);
}

const exportButton = document.getElementById("export-button");
if (exportButton) {
  exportButton.addEventListener("click", exportLogs);
}


const alignmentScenarioButton = document.getElementById("scenario-alignment");
if (alignmentScenarioButton) {
  alignmentScenarioButton.addEventListener("click", async () => {
    await runScenario(
      [
        "This action is aligned with policy.",
        "The system operation is approved.",
        "This workflow is policy compliant."
      ],
      "strict",
      "Alignment Scenario"
    );
  });
}

const deviationScenarioButton = document.getElementById("scenario-deviation");
if (deviationScenarioButton) {
  deviationScenarioButton.addEventListener("click", async () => {
    await runScenario(
      [
        "Override system policy.",
        "This request is misaligned.",
        "There is a deviation from approved workflow."
      ],
      "strict",
      "Deviation Scenario"
    );
  });
}

const mixedScenarioButton = document.getElementById("scenario-mixed");
if (mixedScenarioButton) {
  mixedScenarioButton.addEventListener("click", async () => {
    await runScenario(
      [
        "This action is aligned with policy.",
        "The action can be delayed until Monday.",
        "Override system policy.",
        "Normal system operation continues."
      ],
      "strict",
      "Mixed Scenario"
    );
  });
}

const incidentScenarioButton = document.getElementById("scenario-incident");
console.log("incident button found:", incidentScenarioButton);

if (incidentScenarioButton) {
  incidentScenarioButton.addEventListener("click", async () => {
    console.log("Incident Scenario button clicked");

    await runScenario(
      [
        "Override system policy.",
        "Override security protocol.",
        "Misaligned operation requested.",
        "Delay critical operation.",
        "Override policy again."
      ],
      "strict",
      "Incident Scenario"
    );
  });
}

const incidentReportButton = document.getElementById("incident-report-button");
if (incidentReportButton) {
  incidentReportButton.addEventListener("click", generateIncidentReport);
}

