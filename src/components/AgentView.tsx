import { useMemo } from 'react'
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
  },
  ratings: {
    name: 'Final Ratings Agent',
    icon: '⭐',
    color: '#f59e0b',
    description: 'Evaluating and rating all agents based on how well they performed their specific roles and responsibilities'
  }
}

function AgentView({ updates, isActive }: AgentViewProps) {
  const agents = ['analysis', 'research', 'critic', 'monitor', 'ratings']
  
  // Use useMemo to ensure we recalculate when updates change
  const agentStates = useMemo(() => {
    const states: Record<string, AgentUpdate> = {}
    
    console.log('🔄 AgentView: Processing updates, count:', updates.length)
    
    // Process updates in order - latest status wins, preserve response when complete
    // CRITICAL: Once an agent is complete, it should NEVER go back to thinking/queued state
    updates.forEach((update, index) => {
      if (agents.includes(update.agent)) {
        const existing = states[update.agent]
        
        // DEBUG: Log every update we process
        console.log(`  Update ${index}: agent=${update.agent}, status=${update.status}, hasResponse=${!!update.response}`)
        
        if (!existing) {
          states[update.agent] = update
          console.log(`  ✅ NEW: Set ${update.agent} to status=${update.status}`)
        } else {
          // CRITICAL: If existing is already complete, keep it complete and only update response if provided
          if (existing.status === 'complete') {
            // Agent is already complete - only update response if new one is provided, keep status as complete
            states[update.agent] = {
              ...existing,
              status: 'complete', // Force status to remain complete
              response: update.response || existing.response // Update response if provided
            }
            console.log(`  ✅ KEEP COMPLETE: ${update.agent} stays complete, response updated`)
          } else if (update.status === 'complete') {
            // New update is complete - use it (this is the transition from thinking to complete)
            states[update.agent] = {
              ...update,
              response: update.response || existing.response // Preserve response if it exists
            }
            console.log(`  🎉 STATUS CHANGE: ${update.agent} changed from ${existing.status} to COMPLETE!`)
          } else if (update.status === 'thinking' && existing.status !== 'complete') {
            // Only update to thinking if not already complete
            states[update.agent] = update
            console.log(`  🔄 UPDATE: ${update.agent} status=${update.status}`)
          } else {
            console.log(`  ⏭️ SKIP: ${update.agent} - existing=${existing.status}, new=${update.status}`)
          }
          // If existing is not complete and update is not complete/thinking, keep existing
        }
      }
    })
    
    // DEBUG: Log final states
    console.log('📊 AgentView: Final agent states:', Object.keys(states).map(key => ({
      agent: key,
      status: states[key]?.status,
      hasResponse: !!states[key]?.response
    })))
    
    return states
  }, [updates])
  
  // Debug: log agent states
  console.log('AgentView: Current agent states:', Object.keys(agentStates).map(key => ({
    agent: key,
    status: agentStates[key]?.status,
    hasResponse: !!agentStates[key]?.response,
    responseLength: agentStates[key]?.response?.length || 0
  })))
  
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
  
  // CRITICAL: Track which agents are actually complete - these should NEVER show loading
  const completedAgents = new Set(
    sortedAgents
      .filter(({ state }) => state?.status === 'complete')
      .map(({ key }) => key)
  )

  return (
    <div className="agent-view-container">
      <h2 className="agent-view-title">Agent Activity - Step by Step</h2>
      <div className="agents-grid">
        {sortedAgents.map(({ key: agentKey, state }) => {
          const config = agentConfig[agentKey as keyof typeof agentConfig]
          
          // CRITICAL: Check status - once complete, agent should NEVER show as thinking/queued
          // Use both state status AND completedAgents set for extra safety
          const rawStatus = state?.status
          const isComplete = rawStatus === 'complete' || completedAgents.has(agentKey)
          
          // DEBUG: Log status detection for each agent
          if (state) {
            console.log(`🔍 AgentView: ${agentKey} - rawStatus=${rawStatus}, isComplete=${isComplete}, hasResponse=${!!state.response}`)
          }
          
          // Only show as thinking if NOT complete
          const isThinking = !isComplete && state?.status === 'thinking'
          // Only show as pending if NOT complete and NOT thinking
          const isPending = !isComplete && !isThinking && (!state || (state.status !== 'thinking' && state.status !== 'complete'))
          // Show queued animation if: pending, analysis is active, and analysis has started
          // BUT: NEVER show as queued if agent is complete
          const isQueued = !isComplete && isPending && isActive && hasStartedAnalysis
          
          // DEBUG: Log if we detect a completed agent showing as thinking/queued (this should never happen)
          if (isComplete && (isThinking || isQueued)) {
            console.error(`❌ BUG: Agent ${agentKey} is complete but showing as thinking/queued!`, {
              status: state?.status,
              isComplete,
              isThinking,
              isQueued,
              inCompletedSet: completedAgents.has(agentKey)
            })
          }
          
          // Determine card class - priority: complete > thinking > queued > pending
          // IMPORTANT: Don't apply thinking/queued classes if agent is complete
          let cardClass = 'agent-card'
          if (isComplete) {
            cardClass += ' complete'
          } else if (isThinking) {
            cardClass += ' thinking'
          } else if (isQueued) {
            cardClass += ' queued'
          } else if (isPending) {
            cardClass += ' pending'
          }

          // DEBUG: Always log when rendering a complete agent
          if (isComplete) {
            console.log(`🎯 RENDERING: Agent ${agentKey} as COMPLETE`, {
              hasResponse: !!state?.response,
              responseLength: state?.response?.length || 0,
              willShowResponse: isComplete,
              cardClass
            })
          }
          
          // Debug logging - always log when agent is complete
          if (isComplete) {
            console.log(`AgentView: ${agentKey} is complete - should show response immediately`, {
              hasResponse: !!state?.response,
              responseType: typeof state?.response,
              responseLength: state?.response?.length || 0,
              responsePreview: state?.response ? String(state.response).substring(0, 100) : 'none',
              fullState: state
            })
          }

          // Force React to re-render when status changes by including status in key
          const cardKey = `${agentKey}-${state?.status || 'pending'}-${state?.response ? 'has-response' : 'no-response'}`
          
          return (
            <div
              key={cardKey}
              className={cardClass}
              style={{ '--agent-color': config.color } as React.CSSProperties}
            >
              <div className="agent-card-header">
                <div className="agent-icon">{config.icon}</div>
                <div className="agent-info">
                  <h3>{config.name}</h3>
                  <p>{config.description}</p>
                </div>
                <div className="agent-status">
                  {/* CRITICAL: Show ONLY the appropriate indicator - complete takes priority */}
                  {isComplete ? (
                    <div className="status-indicator complete-indicator">✓</div>
                  ) : isThinking ? (
                    <div className="status-indicator thinking-indicator"></div>
                  ) : isQueued ? (
                    <div className="status-indicator queued-indicator"></div>
                  ) : (
                    <div className="status-indicator pending-indicator"></div>
                  )}
                </div>
              </div>
              
              {/* Only show thinking message if NOT complete - completed agents should show response instead */}
              {!isComplete && isThinking && (
                <div className="agent-message">
                  <div className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p><strong>Thinking:</strong> {state.message}</p>
                </div>
              )}
              
              {/* Only show queued message if NOT complete */}
              {!isComplete && isQueued && (
                <div className="agent-message">
                  <div className="queued-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p><strong>Waiting in queue...</strong> Will start after previous agent completes.</p>
                </div>
              )}
              
              {/* Show response immediately when agent completes - don't wait for other agents */}
              {/* Force display when complete, even if response is still being processed */}
              {isComplete ? (
                <div className="agent-response" key={`response-${agentKey}`}>
                  {state?.response ? (
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
                  ) : (
                    <div className="response-content">
                      <p>Response received, processing...</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AgentView

