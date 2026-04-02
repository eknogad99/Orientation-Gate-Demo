import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div style="max-width: 1200px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif;">
    <h1>AOAL Dashboard</h1>
    <p style="color: #bbb;">
      AOAL evaluates inputs against policy, prioritizes resulting events, and displays current system state.
    </p>

    <div style="display: flex; gap: 12px; margin-top: 12px;">
      <div id="evaluate-panel" style="flex: 1; padding:16px;border:1px solid #444;border-radius:8px;">
        <h2 style="margin-top: 0; color: #8ec5ff;">Evaluate Input</h2>

        <label for="aoal-input"><strong>Input</strong></label>
        <br />
        <textarea
          id="aoal-input"
          rows="4"
          style="width:100%;margin-top:8px;padding:8px;box-sizing:border-box;"
          placeholder="Enter text to evaluate against policy..."
        ></textarea>

        <div style="margin-top:12px;">
          <label for="aoal-mode"><strong>Mode</strong></label>
          <br />
          <select id="aoal-mode" style="margin-top:8px;padding:8px;">
            <option value="strict">strict</option>
            <option value="adaptive">adaptive</option>
          </select>
        </div>

        <div style="margin-top:12px;">
          <button id="evaluate-button" type="button" style="padding:10px 16px;cursor:pointer;">
            Evaluate
          </button>
        </div>

        <div style="margin-top:12px;">
          <button id="export-button" type="button" style="padding:10px 16px;cursor:pointer;">
            Export Logs
          </button>
        </div>
        
        <div style="margin-top:12px;">
          <button id="incident-report-button" type="button" style="padding:10px 16px;cursor:pointer;">
            Generate Incident Report
          </button>
        </div>

        <div style="margin-top:12px;">
  <button id="scenario-alignment" type="button" style="padding:10px 16px;cursor:pointer; margin-right:8px;">
    Run Alignment Scenario
  </button>
  <button id="scenario-deviation" type="button" style="padding:10px 16px;cursor:pointer; margin-right:8px;">
    Run Deviation Scenario
  </button>
  <button id="scenario-mixed" type="button" style="padding:10px 16px;cursor:pointer; margin-right:8px;">
    Run Mixed Scenario
  </button>
  <button id="scenario-incident" type="button" style="padding:10px 16px;cursor:pointer;">
    Run Incident Scenario
  </button>
</div>

        <div id="evaluate-result" style="margin-top:16px;">
          No evaluation yet.
        </div>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
        <div id="status" style="padding:16px;border:1px solid #444;border-radius:8px;">
          Loading status...
        </div>

        <div id="summary" style="padding:16px;border:1px solid #444;border-radius:8px;">
          Loading summary...
        </div>
      </div>
    </div>

    <div id="timeline" style="padding:16px;border:1px solid #444;margin-top:12px;border-radius:8px;">
      Loading timeline...
    </div>

    <div id="architecture" style="padding:16px;border:1px solid #444;margin-top:12px;border-radius:8px;">
      Loading architecture...
    </div>

    <div id="policy" style="padding:16px;border:1px solid #444;margin-top:12px;border-radius:8px;">
      Loading policy...
    </div>
  </div>
`;

async function loadStatus() {
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

async function loadSummary() {
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
      <h2 style="margin-top: 0; color: #8ec5ff;">Summary</h2>
      <p><strong>Top Priority:</strong> ${data.topPriorityTitle}</p>
      <p><strong>Score:</strong> <span style="color: ${scoreColor};">${data.topPriorityScore}</span></p>
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

async function loadTimeline() {
  try {
    const res = await fetch("http://localhost:3001/logs");
    const logs = await res.json();

    const timelineDiv = document.getElementById("timeline");

    if (timelineDiv) {
     const items = logs.map((log: any) => {
  let borderColor = "#666";

  if (log.level === "critical") borderColor = "#ff4d4d";
  else if (log.level === "alert") borderColor = "#ffa500";
  else if (log.level === "warn") borderColor = "#ffd700";
  else borderColor = "#888";

  return `
    <div style="padding:12px;border:2px solid ${borderColor};margin-bottom:10px;border-radius:8px;">
      <p><strong>${log.title}</strong></p>
      <p><strong>Time:</strong> ${log.timestamp}</p>
      <p><strong>Source:</strong> ${log.source}</p>
      <p><strong>Score:</strong> ${log.score}</p>
      <p><strong>Level:</strong> ${log.level}</p>
      <p><strong>Action:</strong><br/>
      </div>
  `;
}).join("");

      timelineDiv.innerHTML = `
        <h2 style="margin-top: 0; color: #8ec5ff;">Event Timeline</h2>
        ${items}
      `;
    }
  } catch (err) {
    console.error("Failed to load timeline", err);
  }
}

function loadArchitecture() {
  const architectureDiv = document.getElementById("architecture");

  if (architectureDiv) {
    architectureDiv.innerHTML = `
      <h2 style="margin-top: 0; color: #8ec5ff;">AOAL Architecture</h2>
      <div style="display:flex;flex-direction:column;gap:10px;max-width:320px;">
        <div style="border:1px solid #666;padding:10px;text-align:center;">Signal Sources</div>
        <div style="text-align:center;">↓</div>
        <div style="border:1px solid #666;padding:10px;text-align:center;">Policy Evaluation Engine</div>
        <div style="text-align:center;">↓</div>
        <div style="border:1px solid #666;padding:10px;text-align:center;">Priority Score</div>
        <div style="text-align:center;">↓</div>
        <div style="border:1px solid #666;padding:10px;text-align:center;">Alert Threshold</div>
        <div style="text-align:center;">↓</div>
        <div style="border:1px solid #666;padding:10px;text-align:center;">Explanation</div>
        <div style="text-align:center;">↓</div>
        <div style="border:1px solid #666;padding:10px;text-align:center;">Dashboard Display</div>
        <div style="text-align:center;">↓</div>
        <div style="border:1px solid #666;padding:10px;text-align:center;">Event Logs</div>
        <div style="text-align:center;">↓</div>
        <div style="border:1px solid #666;padding:10px;text-align:center;">Export Audit Trail</div>
      </div>
    `;
  }
}
async function loadPolicy() {
  try {
    const res = await fetch("http://localhost:3001/policy");
    let rulesData = await res.json();

    const policyDiv = document.getElementById("policy");
    if (!policyDiv) return;

    function renderPolicyEditor() {
      let html = `<h2 style="margin-top:0;color:#8ec5ff;">Policy Rules</h2>`;

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

  async function evaluateInput() {
  const inputEl = document.getElementById("aoal-input") as HTMLTextAreaElement | null;
  const modeEl = document.getElementById("aoal-mode") as HTMLSelectElement | null;
  const resultDiv = document.getElementById("evaluate-result");

  if (!inputEl || !modeEl || !resultDiv) return;

  const input = inputEl.value.trim();
  const mode = modeEl.value;

  if (!input) {
    resultDiv.innerHTML = `<p><strong>Please enter some input first.</strong></p>`;
    return;
  }

  resultDiv.innerHTML = `<p>Evaluating...</p>`;

  try {
    const res = await fetch("http://localhost:3001/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input, mode })
    });

    const data = await res.json();

    let decisionColor = "#aaa";
if (data.decision === "BLOCK") decisionColor = "#ff4d4d";
else if (data.decision === "WARN") decisionColor = "#ffa500";
else if (data.decision === "ALLOW") decisionColor = "#4caf50";

resultDiv.innerHTML = `
  <p><strong>Decision:</strong> 
    <span style="color:${decisionColor}; font-weight:bold;">
      ${data.decision}
    </span>
  </p>
  <p><strong>Score:</strong> ${data.priority}</p>
  <p><strong>Explanation:</strong> ${data.explanation}</p>
`;

    inputEl.value = "";

    await loadStatus;
    await loadSummary();
    await loadTimeline();
  } catch (err) {
    console.error("Failed to evaluate input", err);
    resultDiv.innerHTML = `<p><strong>Evaluation failed.</strong></p>`;
  }
}
function generateIncidentReport() {
  window.open("http://localhost:3001/incident-report", "_blank");
}

async function runSingleEvaluation(input: string, mode: string) {
  await fetch("http://localhost:3001/evaluate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ input, mode })
  });
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
  await loadSummary();
  await loadTimeline();
}

function exportLogs() {
  window.open("http://localhost:3001/export-logs", "_blank");
}


loadSummary();
loadTimeline();
loadArchitecture();
loadPolicy();
loadStatus();


const evaluateButton = document.getElementById("evaluate-button");
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
if (incidentScenarioButton) {
  incidentScenarioButton.addEventListener("click", async () => {
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