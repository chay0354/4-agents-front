import { useState } from 'react'
import ProblemInput from './components/ProblemInput'
import AgentView from './components/AgentView'
import FinalInsights from './components/FinalInsights'
import KernelBubble from './components/KernelBubble'
import './App.css'

interface AgentUpdate {
  agent: string
  stage?: number
  iteration?: number
  status: 'thinking' | 'complete' | 'error'
  message?: string
  response?: string
  done?: boolean
}

function App() {
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async (problem: string) => {
    // Clear previous state and start fresh
    setAgentUpdates([])
    setIsLoading(true)
    // Show immediate loading state for analysis agent
    setAgentUpdates([{
      agent: 'analysis',
      stage: 1,
      iteration: 1,
      status: 'thinking',
      message: 'Starting analysis...'
    }])

    try {
      let backUrl = import.meta.env.VITE_BACK_URL || 'http://127.0.0.1:8000'
      // Remove trailing slash if present to avoid double slashes
      backUrl = backUrl.replace(/\/+$/, '')
      
      const response = await fetch(`${backUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem,
        }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let stopped = false

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              // Handle kernel stop - check system messages for stopped status
              if (data.agent === 'system' && data.status === 'stopped') {
                setIsLoading(false)
                // Clear agent updates to allow fresh start
                setAgentUpdates([])
                stopped = true
                // Show message but don't block - user can start new analysis
                console.log('Analysis stopped:', data.message || 'Analysis stopped by kernel')
                break // Exit the inner loop when stopped
              }
              
              // Skip system messages that are just for initialization
              if (data.agent === 'system' && data.status === 'starting') {
                continue
              }
              
              // Process update immediately - don't wait for all agents
              console.log('Received SSE update:', data.agent, data.status)
              
              // Update state immediately when each agent completes
              setAgentUpdates(prev => {
                const existing = prev.findIndex(u => u.agent === data.agent && (u.stage === data.stage || (!u.stage && !data.stage)))
                if (existing >= 0) {
                  const updated = [...prev]
                  updated[existing] = data
                  // Log for debugging
                  console.log(`Agent ${data.agent} updated:`, data.status, data.response ? `response length: ${data.response.length}` : 'no response')
                  return updated
                }
                // Log for debugging
                console.log(`New agent update: ${data.agent}`, data.status)
                return [...prev, data]
              })

              // Keep loading state true as long as agents are processing
              // Only set to false when analysis is completely done
              if (data.done) {
                setIsLoading(false)
              } else {
                // Ensure loading stays true while any agent is working
                // This includes when new agents start (thinking) or complete
                setIsLoading(true)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
        
        // Break outer loop if stopped
        if (stopped) {
          break
        }
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to analyze problem. Please check if the backend is running.')
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>4-Agents MOP System</h1>
        <p className="subtitle">Multi-Agent Problem-solving for Research & Development</p>
      </header>

      <main className="app-main">
        <ProblemInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        
        {(isLoading || agentUpdates.length > 0) && (
          <AgentView updates={agentUpdates} isActive={isLoading} />
        )}
        
        {(() => {
          const summaryUpdate = agentUpdates.find(u => u.agent === 'summary' && u.status === 'complete')
          return summaryUpdate?.response ? (
            <FinalInsights insights={summaryUpdate.response} />
          ) : null
        })()}
      </main>
      
      <KernelBubble isActive={isLoading} />
    </div>
  )
}

export default App
