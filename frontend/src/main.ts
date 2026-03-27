const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div style="min-height: 100vh; background: #0b1220; color: #e5eefc; font-family: Arial, sans-serif; padding: 24px;">
    <h2 style="margin-top: 0; color: #8ec5ff;">AOAL - Step 18</h2>

    <div id="summaryBanner" style="margin-bottom: 16px; padding: 12px; background: #131c31; border: 1px solid #22304f; border-radius: 10px; color: #cbd5e1;">
      <div><strong>Mode:</strong> <span id="summaryMode">strict</span></div>
      <div><strong>Top Priority Panel:</strong> <span id="summaryTop">--</span></div>
      <div><strong>Total Logged Events:</strong> <span id="summaryCount">0</span></div>
      <div><strong>Backend Status:</strong> <span id="summaryBackend">Unknown</span></div>
    </div>

    <div style="margin-bottom: 16px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
      <label for="modeSelect" style="color: #cbd5e1;">Policy Mode:</label>
      <select id="modeSelect" style="padding: 8px; border-radius: 6px; background: #0f172a; color: white; border: 1px solid #334155;">
        <option value="strict">Strict</option>
        <option value="adaptive">Adaptive</option>
      </select>

      <label for="thresholdSelect" style="color: #cbd5e1;">Alert Threshold:</label>
      <select id="thresholdSelect" style="padding: 8px; border-radius: 6px; background: #0f172a; color: white; border: 1px solid #334155;">
        <option value="50">50</option>
        <option value="70" selected>70</option>
        <option value="85">85</option>
      </select>

      <button id="liveBtn" style="padding: 8px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Start Live Mode</button>
      <button id="fetchABtn" style="padding: 8px 12px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer;">Fetch Real Signal A</button>
      <button id="exportBtn" style="padding: 8px 12px; background: #0f766e; color: white; border: none; border-radius: 6px; cursor: pointer;">Export Logs</button>
      <button id="resetBtn" style="padding: 8px 12px; background: #b91c1c; color: white; border: none; border-radius: 6px; cursor: pointer;">Reset System</button>
    </div>

    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
      <div id="panelA" style="background: #131c31; border: 1px solid #22304f; border-radius: 10px; padding: 16px; width: 300px;">
        <h3>Signal A</h3>
        <div style="font-size: 12px; color: #9fb3d9; margin-bottom: 8px;">Source: Real External Quote Feed</div>
        <input id="inputA" placeholder="Enter signal A..." style="width: 100%; margin-bottom: 10px; padding: 8px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white;" />
        <button id="runA" style="margin-bottom: 10px; padding: 8px 12px; background: #475569; color: white; border: none; border-radius: 6px; cursor: pointer;">Evaluate A</button>
        <div id="resultA">Waiting...</div>
        <div id="explainA" style="margin-top: 6px; font-size: 12px; color: #94a3b8;">Explanation: --</div>
        <div id="priorityA" style="margin-top: 8px; color: #facc15;">Priority: --</div>
        <div id="alertA" style="margin-top: 6px; color: #f87171;">Alert: --</div>
        <div style="margin-top: 8px; background: #1e293b; border-radius: 999px; height: 10px; overflow: hidden;">
          <div id="barA" style="height: 10px; width: 0%; background: #38bdf8;"></div>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #93c5fd;">Recent Events</div>
        <div id="logA" style="margin-top: 6px; max-height: 120px; overflow-y: auto; font-size: 12px; color: #cbd5e1; border-top: 1px solid #22304f; padding-top: 8px;"></div>
      </div>

      <div id="panelB" style="background: #131c31; border: 1px solid #22304f; border-radius: 10px; padding: 16px; width: 300px;">
        <h3>Signal B</h3>
        <div style="font-size: 12px; color: #9fb3d9; margin-bottom: 8px;">Source: External Advisory Feed</div>
        <input id="inputB" placeholder="Enter signal B..." style="width: 100%; margin-bottom: 10px; padding: 8px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white;" />
        <button id="runB" style="margin-bottom: 10px; padding: 8px 12px; background: #475569; color: white; border: none; border-radius: 6px; cursor: pointer;">Evaluate B</button>
        <div id="resultB">Waiting...</div>
        <div id="explainB" style="margin-top: 6px; font-size: 12px; color: #94a3b8;">Explanation: --</div>
        <div id="priorityB" style="margin-top: 8px; color: #facc15;">Priority: --</div>
        <div id="alertB" style="margin-top: 6px; color: #f87171;">Alert: --</div>
        <div style="margin-top: 8px; background: #1e293b; border-radius: 999px; height: 10px; overflow: hidden;">
          <div id="barB" style="height: 10px; width: 0%; background: #38bdf8;"></div>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #93c5fd;">Recent Events</div>
        <div id="logB" style="margin-top: 6px; max-height: 120px; overflow-y: auto; font-size: 12px; color: #cbd5e1; border-top: 1px solid #22304f; padding-top: 8px;"></div>
      </div>

      <div id="panelC" style="background: #131c31; border: 1px solid #22304f; border-radius: 10px; padding: 16px; width: 300px;">
        <h3>Signal C</h3>
        <div style="font-size: 12px; color: #9fb3d9; margin-bottom: 8px;">Source: Operational Noise Feed</div>
        <input id="inputC" placeholder="Enter signal C..." style="width: 100%; margin-bottom: 10px; padding: 8px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white;" />
        <button id="runC" style="margin-bottom: 10px; padding: 8px 12px; background: #475569; color: white; border: none; border-radius: 6px; cursor: pointer;">Evaluate C</button>
        <div id="resultC">Waiting...</div>
        <div id="explainC" style="margin-top: 6px; font-size: 12px; color: #94a3b8;">Explanation: --</div>
        <div id="priorityC" style="margin-top: 8px; color: #facc15;">Priority: --</div>
        <div id="alertC" style="margin-top: 6px; color: #f87171;">Alert: --</div>
        <div style="margin-top: 8px; background: #1e293b; border-radius: 999px; height: 10px; overflow: hidden;">
          <div id="barC" style="height: 10px; width: 0%; background: #38bdf8;"></div>
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #93c5fd;">Recent Events</div>
        <div id="logC" style="margin-top: 6px; max-height: 120px; overflow-y: auto; font-size: 12px; color: #cbd5e1; border-top: 1px solid #22304f; padding-top: 8px;"></div>
      </div>
    </div>
  </div>
`;

type PanelID = "A" | "B" | "C";
type LogEntry = {
  time: string;
  panel: PanelID;
  source: string;
  input: string;
  result: string;
  priority: number;
  explanation: string;
};


const auditLog: LogEntry[] = [];
const latestPriority: Record<PanelID, number> = { A: 0, B: 0, C: 0 };
const panelSources: Record<PanelID, string> = {
  A: "Real External Quote Feed",
  B: "External Advisory Feed",
  C: "Operational Noise Feed"
}; 
let liveInterval: number | undefined;

async function evaluateSignal(value: string): Promise<{ result: string; priority: number; explanation: string }> {
  const modeSelect = document.querySelector<HTMLSelectElement>("#modeSelect")!;
  const mode = modeSelect.value;

  const response = await fetch("http://localhost:3001/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: value, mode })
  });

  if (!response.ok) {
    throw new Error("Backend evaluation failed");
  }

  return response.json();
}

function randomSignal(): string {
  const signals = [
    "policy secure",
    "random text",
    "aligned directive",
    "unknown anomaly",
    "policy review",
    "external noise"
  ];
  return signals[Math.floor(Math.random() * signals.length)];
}

async function fetchRealSignalA(): Promise<string> {
  try {
    const response = await fetch("https://api.chucknorris.io/jokes/random");
    const data = await response.json();
    return data.value || "external signal unavailable";
  } catch {
    return "external signal unavailable";
  }
}

function logResult(
  panel: PanelID,
  input: string,
  result: string,
  priority: number,
  explanation: string
) {
  auditLog.push(
console.log(auditLog[auditLog.length - 1]),{
    
    time: new Date().toISOString(),
    panel,
    source: panelSources[panel],
    input,
    result,
    priority,
    explanation
  });
}


function addLogEntry(panel: PanelID, input: string, result: string) {
  const logEl = document.querySelector<HTMLDivElement>("#log" + panel);
  if (!logEl) return;

  const entry = document.createElement("div");
  const time = new Date().toLocaleTimeString();
  const source = panelSources[panel];

  entry.style.marginBottom = "6px";
  entry.style.paddingBottom = "6px";
  entry.style.borderBottom = "1px solid #1e293b";
  entry.innerText = `${time} | ${source} | ${input} | ${result}`;

  logEl.prepend(entry);

  while (logEl.childElementCount > 5) {
    logEl.removeChild(logEl.lastElementChild!);
  }
}

function updatePriorityDisplay() {
  const panels: PanelID[] = ["A", "B", "C"];
  const thresholdSelect = document.querySelector<HTMLSelectElement>("#thresholdSelect");
  const threshold = thresholdSelect ? Number(thresholdSelect.value) : 70;
  let topPanel: PanelID = "A";

  for (const panel of panels) {
    if (latestPriority[panel] > latestPriority[topPanel]) {
      topPanel = panel;
    }
  }

  for (const panel of panels) {
    const panelEl = document.querySelector<HTMLDivElement>("#panel" + panel);
    const priorityEl = document.querySelector<HTMLDivElement>("#priority" + panel);
    const barEl = document.querySelector<HTMLDivElement>("#bar" + panel);
    const alertEl = document.querySelector<HTMLDivElement>("#alert" + panel);

    if (!panelEl || !priorityEl || !barEl || !alertEl) continue;

    priorityEl.innerText = "Priority: " + latestPriority[panel];
    barEl.style.width = latestPriority[panel] + "%";

    if (latestPriority[panel] >= 80) {
      barEl.style.background = "#22c55e";
    } else if (latestPriority[panel] >= 50) {
      barEl.style.background = "#f59e0b";
    } else {
      barEl.style.background = "#ef4444";
    }

    if (latestPriority[panel] < threshold && latestPriority[panel] > 0) {
      alertEl.innerText = "Alert: BELOW THRESHOLD";
      alertEl.style.color = "#ef4444";
    } else if (latestPriority[panel] > 0) {
      alertEl.innerText = "Alert: OK";
      alertEl.style.color = "#22c55e";
    } else {
      alertEl.innerText = "Alert: --";
      alertEl.style.color = "#f87171";
    }

    if (panel === topPanel && latestPriority[panel] > 0) {
      panelEl.style.boxShadow = "0 0 20px rgba(250, 204, 21, 0.5)";
      panelEl.style.border = "1px solid #facc15";
    } else {
      panelEl.style.boxShadow = "none";
      panelEl.style.border = "1px solid #22304f";
    }
  }
}

function updateSummaryBanner() {
  const modeSelect = document.querySelector<HTMLSelectElement>("#modeSelect");
  const summaryMode = document.querySelector<HTMLSpanElement>("#summaryMode");
  const summaryTop = document.querySelector<HTMLSpanElement>("#summaryTop");
  const summaryCount = document.querySelector<HTMLSpanElement>("#summaryCount");
  const summaryBackend = document.querySelector<HTMLSpanElement>("#summaryBackend");

  if (!modeSelect || !summaryMode || !summaryTop || !summaryCount || !summaryBackend) return;

  summaryMode.innerText = modeSelect.value;
  summaryCount.innerText = String(auditLog.length);

  const panels: PanelID[] = ["A", "B", "C"];
  let topPanel: PanelID = "A";

  for (const panel of panels) {
    if (latestPriority[panel] > latestPriority[topPanel]) {
      topPanel = panel;
    }
  }

  summaryTop.innerText = latestPriority[topPanel] > 0 ? topPanel : "--";
  summaryBackend.innerText = "Online";
}

const inputA = document.querySelector<HTMLInputElement>("#inputA")!;
const buttonA = document.querySelector<HTMLButtonElement>("#runA")!;
const resultA = document.querySelector<HTMLDivElement>("#resultA")!;
const explainA = document.querySelector<HTMLDivElement>("#explainA")!;

const inputB = document.querySelector<HTMLInputElement>("#inputB")!;
const buttonB = document.querySelector<HTMLButtonElement>("#runB")!;
const resultB = document.querySelector<HTMLDivElement>("#resultB")!;
const explainB = document.querySelector<HTMLDivElement>("#explainB")!;

const inputC = document.querySelector<HTMLInputElement>("#inputC")!;
const buttonC = document.querySelector<HTMLButtonElement>("#runC")!;
const resultC = document.querySelector<HTMLDivElement>("#resultC")!;
const explainC = document.querySelector<HTMLDivElement>("#explainC")!;

const liveBtn = document.querySelector<HTMLButtonElement>("#liveBtn")!;
const fetchABtn = document.querySelector<HTMLButtonElement>("#fetchABtn")!;
const exportBtn = document.querySelector<HTMLButtonElement>("#exportBtn")!;
const resetBtn = document.querySelector<HTMLButtonElement>("#resetBtn")!;
const thresholdSelect = document.querySelector<HTMLSelectElement>("#thresholdSelect")!;

function markOffline() {
  const summaryBackend = document.querySelector<HTMLSpanElement>("#summaryBackend");
  if (summaryBackend) summaryBackend.innerText = "Offline";
}

function resetSystem() {
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = undefined;
  }

  inputA.value = "";
  inputB.value = "";
  inputC.value = "";

  resultA.innerText = "Waiting...";
  resultB.innerText = "Waiting...";
  resultC.innerText = "Waiting...";

  explainA.innerText = "Explanation: --";
  explainB.innerText = "Explanation: --";
  explainC.innerText = "Explanation: --";

  latestPriority.A = 0;
  latestPriority.B = 0;
  latestPriority.C = 0;

  const logA = document.querySelector<HTMLDivElement>("#logA");
  const logB = document.querySelector<HTMLDivElement>("#logB");
  const logC = document.querySelector<HTMLDivElement>("#logC");

  if (logA) logA.innerHTML = "";
  if (logB) logB.innerHTML = "";
  if (logC) logC.innerHTML = "";

  const barA = document.querySelector<HTMLDivElement>("#barA");
  const barB = document.querySelector<HTMLDivElement>("#barB");
  const barC = document.querySelector<HTMLDivElement>("#barC");

  if (barA) { barA.style.width = "0%"; barA.style.background = "#38bdf8"; }
  if (barB) { barB.style.width = "0%"; barB.style.background = "#38bdf8"; }
  if (barC) { barC.style.width = "0%"; barC.style.background = "#38bdf8"; }

  liveBtn.innerText = "Start Live Mode";
  auditLog.length = 0;

  const summaryBackend = document.querySelector<HTMLSpanElement>("#summaryBackend");
  if (summaryBackend) summaryBackend.innerText = "Online";

  updatePriorityDisplay();
  updateSummaryBanner();
}

buttonA.onclick = async () => {
  try {
    const evaluated = await evaluateSignal(inputA.value);
    resultA.innerText = evaluated.result;
    explainA.innerText = "Explanation: " + evaluated.explanation;
    latestPriority.A = evaluated.priority;
    logResult("A", inputA.value, evaluated.result, evaluated.priority, evaluated.explanation);
    addLogEntry("A", inputA.value, evaluated.result);
    updatePriorityDisplay();
    updateSummaryBanner();
  } catch (error) {
    resultA.innerText = "Backend unavailable";
    explainA.innerText = "Explanation: --";
    markOffline();
  }
};

buttonB.onclick = async () => {
  try {
    const evaluated = await evaluateSignal(inputB.value);
    resultB.innerText = evaluated.result;
    explainB.innerText = "Explanation: " + evaluated.explanation;
    latestPriority.B = evaluated.priority;
    logResult("B", inputB.value, evaluated.result, evaluated.priority, evaluated.explanation);
    addLogEntry("B", inputB.value, evaluated.result);
    updatePriorityDisplay();
    updateSummaryBanner();
  } catch (error) {
    resultB.innerText = "Backend unavailable";
    explainB.innerText = "Explanation: --";
    markOffline();
  }
};

buttonC.onclick = async () => {
  try {
    const evaluated = await evaluateSignal(inputC.value);
    resultC.innerText = evaluated.result;
    explainC.innerText = "Explanation: " + evaluated.explanation;
    latestPriority.C = evaluated.priority;
    logResult("C", inputC.value, evaluated.result, evaluated.priority, evaluated.explanation);
    addLogEntry("C", inputC.value, evaluated.result);
    updatePriorityDisplay();
    updateSummaryBanner();
  } catch (error) {
    resultC.innerText = "Backend unavailable";
    explainC.innerText = "Explanation: --";
    markOffline();
  }
};

fetchABtn.onclick = async () => {
  inputA.value = "Loading real external signal...";
  const realSignal = await fetchRealSignalA();
  inputA.value = realSignal;

  try {
    const evaluated = await evaluateSignal(inputA.value);
    resultA.innerText = evaluated.result;
    explainA.innerText = "Explanation: " + evaluated.explanation;
    latestPriority.A = evaluated.priority;
    logResult("A", inputA.value, evaluated.result, evaluated.priority, evaluated.explanation);
    addLogEntry("A", inputA.value, evaluated.result);
    updatePriorityDisplay();
    updateSummaryBanner();
  } catch (error) {
    resultA.innerText = "Backend unavailable";
    explainA.innerText = "Explanation: --";
    markOffline();
  }
};

liveBtn.onclick = () => {
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = undefined;
    liveBtn.innerText = "Start Live Mode";
    return;
  }

  liveBtn.innerText = "Stop Live Mode";

  liveInterval = window.setInterval(async () => {
    inputA.value = randomSignal();
    inputB.value = randomSignal();
    inputC.value = randomSignal();

    try {
      const [evalA, evalB, evalC] = await Promise.all([
        evaluateSignal(inputA.value),
        evaluateSignal(inputB.value),
        evaluateSignal(inputC.value)
      ]);

      resultA.innerText = evalA.result;
      explainA.innerText = "Explanation: " + evalA.explanation;
      latestPriority.A = evalA.priority;
      logResult("A", inputA.value, evaluated.result, evaluated.priority, evaluated.explanation);
      addLogEntry("A", inputA.value, evalA.result);

      resultB.innerText = evalB.result;
      explainB.innerText = "Explanation: " + evalB.explanation;
      latestPriority.B = evalB.priority;
      logResult("B", inputB.value, evaluated.result, evaluated.priority, evaluated.explanation);
      addLogEntry("B", inputB.value, evalB.result);

      resultC.innerText = evalC.result;
      explainC.innerText = "Explanation: " + evalC.explanation;
      latestPriority.C = evalC.priority;
      logResult("C", inputC.value, evaluated.result, evaluated.priority, evaluated.explanation);
      addLogEntry("C", inputC.value, evalC.result);

      updatePriorityDisplay();
      updateSummaryBanner();
    } catch (error) {
      resultA.innerText = "Backend unavailable";
      resultB.innerText = "Backend unavailable";
      resultC.innerText = "Backend unavailable";
      explainA.innerText = "Explanation: --";
      explainB.innerText = "Explanation: --";
      explainC.innerText = "Explanation: --";
      markOffline();
    }
  }, 2000);
};

exportBtn.onclick = () => {
  const data = JSON.stringify(auditLog, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "aoal_audit_log.json";
  a.click();

  URL.revokeObjectURL(url);
};

resetBtn.onclick = () => {
  resetSystem();
};

thresholdSelect.onchange = () => {
  updatePriorityDisplay();
  updateSummaryBanner();
};

updateSummaryBanner();