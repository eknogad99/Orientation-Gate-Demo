import './style.css'

console.log("MAIN.TS IS RUNNING");

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>AOAL Dashboard</h1>

    <div id="summary" style="padding:16px;border:1px solid #444;margin-top:12px;">
      Loading summary...
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

loadSummary();