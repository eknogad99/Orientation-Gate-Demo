import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>AOAL Dashboard</h1>

    <div id="evaluate-panel" style="padding:16px;border:1px solid #444;margin-top:12px;">
      <h2 style="margin-top: 0; color: #8ec5ff;">Evaluate Input</h2>

      <label for="aoal-input"><strong>Input</strong></label>
      <br />
      <textarea
        id="aoal-input"
        rows="4"
        style="width:100%;margin-top:8px;padding:8px;"
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
        <button id="evaluate-button" style="padding:10px 16px;cursor:pointer;">
          Evaluate
        </button>
      </div>

      <div id="evaluate-result" style="margin-top:16px;">
        No evaluation yet.
      </div>
    </div>

    <div id="summary" style="padding:16px;border:1px solid #444;margin-top:12px;">
      Loading summary...
    </div>

    <div id="timeline" style="padding:16px;border:1px solid #444;margin-top:12px;">
      Loading timeline...
    </div>

    <div id="architecture" style="padding:16px;border:1px solid #444;margin-top:12px;">
      Loading architecture...
    </div>
  </div>
`;

async function loadSummary() {
  try {
    const res = await fetch("http://localhost:3001/summary");
    const data = await res.json();

    const summaryDiv = document.getElementById("summary");

    if (summaryDiv) {
      summaryDiv.innerHTML = `
        <h2 style="margin-top: 0; color: #8ec5ff;">Summary</h2>
        <p><strong>Top Priority:</strong> ${data.topPriorityTitle}</p>
        <p><strong>Score:</strong> ${data.topPriorityScore}</p>
        <p><strong>Primary Source:</strong> ${data.topPrioritySource}</p>
        <p><strong>Reason:</strong> ${data.topPrioritySourceReason}</p>
        <p><strong>Total Events:</strong> ${data.totalEvents}</p>
        <p><strong>Total Alerts:</strong> ${data.totalAlerts}</p>
      `;
    }
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
      const items = logs.map((log: any) => `
        <div style="padding:12px;border:1px solid #666;margin-bottom:10px;border-radius:8px;">
          <p><strong>${log.title}</strong></p>
          <p><strong>Time:</strong> ${log.timestamp}</p>
          <p><strong>Source:</strong> ${log.source}</p>
          <p><strong>Score:</strong> ${log.score}</p>
          <p><strong>Level:</strong> ${log.level}</p>
          <p><strong>Explanation:</strong> ${log.explanation}</p>
        </div>
      `).join("");

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

      <div style="display:flex;flex-direction:column;gap:10px;max-width:300px;">
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

    resultDiv.innerHTML = `
      <h3 style="margin-bottom:8px;">Evaluation Result</h3>
      <p><strong>Result:</strong> ${data.result}</p>
      <p><strong>Priority:</strong> ${data.priority}</p>
      <p><strong>Explanation:</strong> ${data.explanation}</p>
    `;
  } catch (err) {
    console.error("Failed to evaluate input", err);
    resultDiv.innerHTML = `<p><strong>Evaluation failed.</strong></p>`;
  }
}

loadSummary();
loadTimeline();
loadArchitecture();

const evaluateButton = document.getElementById("evaluate-button");
if (evaluateButton) {
  evaluateButton.addEventListener("click", evaluateInput);
}