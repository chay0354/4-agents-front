import './AgentView.css'

interface AgentUpdate {
  agent: string
  stage?: number
  iteration?: number
  status: 'thinking' | 'complete' | 'error'
  message?: string
  response?: string
  done?: boolean
}

interface AgentViewProps {
  updates: AgentUpdate[]
  isActive?: boolean
}

const agentConfig = {
  analysis: {
    name: 'Analysis Agent',
    icon: '🔍',
    color: '#6366f1',
    description: 'Understanding the problem, breaking it down into sub-problems, and building a thinking plan'
  },
  research: {
    name: 'Research Agent',
    icon: '📚',
    color: '#10b981',
    description: 'Gathering relevant knowledge, existing information, professional assumptions, and theoretical insights'
  },
  critic: {
    name: 'Critic Agent',
    icon: '⚖️',
    color: '#ef4444',
    description: 'Critically evaluating the solution, identifying weaknesses, contradictions, false assumptions, and risks'
  },
  monitor: {
    name: 'Monitor Agent',
    icon: '👁️',
    color: '#3b82f6',
    description: 'Supervising the thinking process, identifying loops or deviations, deciding if another iteration is needed'
  }
}

function AgentView({ updates, isActive }: AgentViewProps) {
  const agents = ['analysis', 'research', 'critic', 'monitor']
  
  // Get the latest update for each agent - show results immediately as they arrive
  const agentStates: Record<string, AgentUpdate> = {}
  
  // Process updates in order - latest status wins
  updates.forEach(update => {
    if (agents.includes(update.agent)) {
      const existing = agentStates[update.agent]
      if (!existing) {
        agentStates[update.agent] = update
      } else {
        // Always prefer 'complete' status over 'thinking', or newer updates
        if (update.status === 'complete') {
          // If new update is complete, always use it (even if existing is also complete, use newer)
          agentStates[update.agent] = update
        } else if (existing.status !== 'complete' && update.status === 'thinking') {
          // Only update if existing is not complete and new is thinking
          agentStates[update.agent] = update
        }
        // If both are complete, the first condition already handles it
        // If existing is complete and update is not, keep existing (don't update)
      }
    }
  })
  
  // Sort agents by stage number
  const sortedAgents = agents.map(agentKey => {
    const state = agentStates[agentKey]
    return {
      key: agentKey,
      stage: state?.stage || 999,
      state
    }
  }).sort((a, b) => a.stage - b.stage)
  
  // Determine if analysis is in progress (any agent has started or completed)
  const hasStartedAnalysis = sortedAgents.some(({ state }) => state?.status === 'thinking' || state?.status === 'complete')

  return (
    <div className="agent-view-container">
      <h2 className="agent-view-title">Agent Activity - Step by Step</h2>
      <div className="agents-grid">
        {sortedAgents.map(({ key: agentKey, state }) => {
          const config = agentConfig[agentKey as keyof typeof agentConfig]
          const isThinking = state?.status === 'thinking'
          const isComplete = state?.status === 'complete'
          const isPending = !state || (state.status !== 'thinking' && state.status !== 'complete')
          // Show queued animation if: pending, analysis is active, and analysis has started (even if no agent is currently thinking)
          const isQueued = isPending && isActive && hasStartedAnalysis

          return (
            <div
              key={agentKey}
              className={`agent-card ${isThinking ? 'thinking' : ''} ${isComplete ? 'complete' : ''} ${isPending ? 'pending' : ''} ${isQueued ? 'queued' : ''}`}
              style={{ '--agent-color': config.color } as React.CSSProperties}
            >
              <div className="agent-card-header">
                <div className="agent-icon">{config.icon}</div>
                <div className="agent-info">
                  <h3>{config.name}</h3>
                  <p>{config.description}</p>
                </div>
                <div className="agent-status">
                  {isThinking && <div className="status-indicator thinking-indicator"></div>}
                  {isComplete && <div className="status-indicator complete-indicator">✓</div>}
                  {isQueued && <div className="status-indicator queued-indicator"></div>}
                  {isPending && !isQueued && <div className="status-indicator pending-indicator"></div>}
                </div>
              </div>
              
              {isThinking && (
                <div className="agent-message">
                  <div className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p><strong>Thinking:</strong> {state.message}</p>
                </div>
              )}
              
              {isQueued && (
                <div className="agent-message">
                  <div className="queued-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p><strong>Waiting in queue...</strong> Will start after previous agent completes.</p>
                </div>
              )}
              
              {isComplete && state.response && (
                <div className="agent-response">
                  <div className="response-content">
                    {(() => {
                      // Extract only the text content, strip any object metadata
                      let cleanText = String(state.response);
                      
                      // If response contains object structure, extract just the text field
                      if (cleanText.includes('ResponseOutputText') || cleanText.includes("text='") || cleanText.includes('text="')) {
                        // Try multiple regex patterns to extract text
                        const patterns = [
                          /text=['"](.*?)['"]/s,  // text='...' or text="..."
                          /text=([^,}]+)/,        // text=...
                          /'text':\s*['"](.*?)['"]/s,  // 'text': '...'
                          /"text":\s*["'](.*?)["']/s   // "text": "..."
                        ];
                        
                        for (const pattern of patterns) {
                          const match = cleanText.match(pattern);
                          if (match && match[1]) {
                            cleanText = match[1]
                              .replace(/\\n/g, '\n')  // Unescape newlines
                              .replace(/\\'/g, "'")   // Unescape quotes
                              .replace(/\\"/g, '"')   // Unescape quotes
                              .trim();
                            break;
                          }
                        }
                      }
                      
                      // Process text with markdown formatting (like ChatGPT)
                      const processText = (text: string) => {
                        if (!text) return '';
                        
                        // Split by newlines and process each line
                        const lines = text.split('\n');
                        return lines.map((line, lineIdx) => {
                          // Check for headers (## or ###)
                          if (line.trim().startsWith('###')) {
                            const headerText = line.replace(/^###+\s*/, '').trim();
                            // Process bold in header
                            const parts = headerText.split(/(\*\*.*?\*\*)/g);
                            const processedParts = parts.map((part, partIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
                              }
                              return part;
                            });
                            return <h3 key={lineIdx} className="markdown-h3">{processedParts}</h3>;
                          } else if (line.trim().startsWith('##')) {
                            const headerText = line.replace(/^##+\s*/, '').trim();
                            // Process bold in header
                            const parts = headerText.split(/(\*\*.*?\*\*)/g);
                            const processedParts = parts.map((part, partIdx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
                              }
                              return part;
                            });
                            return <h2 key={lineIdx} className="markdown-h2">{processedParts}</h2>;
                          }
                          
                          // Process markdown bold (**text**)
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          const processedParts = parts.map((part, partIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          });
                          
                          return (
                            <span key={lineIdx}>
                              {processedParts}
                              {lineIdx < lines.length - 1 && <br />}
                            </span>
                          );
                        });
                      };
                      
                      return processText(cleanText);
                    })()}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AgentView

