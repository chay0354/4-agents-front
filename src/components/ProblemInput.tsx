import { useState } from 'react'
import './ProblemInput.css'

interface ProblemInputProps {
  onAnalyze: (problem: string) => void
  isLoading: boolean
}

function ProblemInput({ onAnalyze, isLoading }: ProblemInputProps) {
  const [problem, setProblem] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (problem.trim()) {
      onAnalyze(problem.trim())
    }
  }

  return (
    <div className="problem-input-container">
      <form onSubmit={handleSubmit} className="problem-form">
        <div className="form-group">
          <label htmlFor="problem">Enter Problem / Question / Research Challenge</label>
          <textarea
            id="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Describe the problem, question, or research challenge you want to analyze..."
            rows={6}
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isLoading || !problem.trim()}
        >
          {isLoading ? 'Analyzing...' : 'Start Analysis'}
        </button>
      </form>
    </div>
  )
}

export default ProblemInput

