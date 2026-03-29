import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>AOAL Dashboard</h1>

    <div id="summary" style="padding:16px;border:1px solid #444;margin-top:12px;">
      Loading summary...
    </div>

    <div id="timeline" style="padding:16px;border:1px solid #444;margin-top:12px;">
      Loading timeline...
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

loadSummary();
loadTimeline();