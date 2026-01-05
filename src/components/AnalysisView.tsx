import { useState } from 'react'
import { AnalysisResult } from '../types'
import './AnalysisView.css'

interface AnalysisViewProps {
  result: AnalysisResult
}

function AnalysisView({ result }: AnalysisViewProps) {
  const [expandedIteration, setExpandedIteration] = useState<number | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleIteration = (iteration: number) => {
    if (expandedIteration === iteration) {
      setExpandedIteration(null)
      setExpandedSection(null)
    } else {
      setExpandedIteration(iteration)
      setExpandedSection(null)
    }
  }

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  return (
    <div className="analysis-view">
      <div className="analysis-header">
        <h2>Analysis Results</h2>
        <div className="analysis-meta">
          <span>Problem: {result.problem}</span>
          <span>Iterations: {result.total_iterations}</span>
          <span>Status: {result.status}</span>
        </div>
      </div>

      <div className="iterations-container">
        {result.iterations.map((iteration) => (
          <div key={iteration.iteration} className="iteration-card">
            <div
              className="iteration-header"
              onClick={() => toggleIteration(iteration.iteration)}
            >
              <h3>
                Iteration {iteration.iteration}
                <span className={`decision-badge ${iteration.monitor_decision.toLowerCase()}`}>
                  {iteration.monitor_decision}
                </span>
              </h3>
              <span className="toggle-icon">
                {expandedIteration === iteration.iteration ? '▼' : '▶'}
              </span>
            </div>

            {expandedIteration === iteration.iteration && (
              <div className="iteration-content">
                <AgentSection
                  title="Analysis Agent"
                  content={iteration.analysis}
                  agentType="analysis"
                  isExpanded={expandedSection === `analysis-${iteration.iteration}`}
                  onToggle={() => toggleSection(`analysis-${iteration.iteration}`)}
                />
                <AgentSection
                  title="Research Agent"
                  content={iteration.research}
                  agentType="research"
                  isExpanded={expandedSection === `research-${iteration.iteration}`}
                  onToggle={() => toggleSection(`research-${iteration.iteration}`)}
                />
                <AgentSection
                  title="Solution Synthesis"
                  content={iteration.solution}
                  agentType="solution"
                  isExpanded={expandedSection === `solution-${iteration.iteration}`}
                  onToggle={() => toggleSection(`solution-${iteration.iteration}`)}
                />
                <AgentSection
                  title="Critic Agent"
                  content={iteration.critique}
                  agentType="critic"
                  isExpanded={expandedSection === `critic-${iteration.iteration}`}
                  onToggle={() => toggleSection(`critic-${iteration.iteration}`)}
                />
                <AgentSection
                  title="Monitor Agent"
                  content={iteration.monitor}
                  agentType="monitor"
                  isExpanded={expandedSection === `monitor-${iteration.iteration}`}
                  onToggle={() => toggleSection(`monitor-${iteration.iteration}`)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="final-insights">
        <h2>Final Insights & Principles</h2>
        <div className="insights-content">
          {result.final_insights.split('\n').map((line, idx) => (
            <p key={idx}>{line || '\u00A0'}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

interface AgentSectionProps {
  title: string
  content: string
  agentType: string
  isExpanded: boolean
  onToggle: () => void
}

function AgentSection({
  title,
  content,
  agentType,
  isExpanded,
  onToggle,
}: AgentSectionProps) {
  return (
    <div className={`agent-section ${agentType}`}>
      <div className="agent-header" onClick={onToggle}>
        <h4>{title}</h4>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="agent-content">
          {content.split('\n').map((line, idx) => (
            <p key={idx}>{line || '\u00A0'}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default AnalysisView


