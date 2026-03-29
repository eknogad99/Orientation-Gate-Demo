type SummaryItem = {
  topPriorityTitle: string
  topPriorityScore: number
  topPriorityLevel: "low" | "medium" | "high" | "critical"
  topPrioritySource?: string
  topPrioritySourceReason?: string
}