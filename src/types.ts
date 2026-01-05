export interface Iteration {
  iteration: number
  timestamp: string
  analysis: string
  research: string
  solution: string
  critique: string
  monitor: string
  monitor_decision: string
}

export interface AnalysisResult {
  problem: string
  iterations: Iteration[]
  final_insights: string
  status: string
  total_iterations: number
  created_at: string
}


