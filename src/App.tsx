import { useState } from 'react'
import ProblemInput from './components/ProblemInput'
import AgentView from './components/AgentView'
import FinalInsights from './components/FinalInsights'
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
    setIsLoading(true)
    setAgentUpdates([])

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
              setAgentUpdates(prev => {
                const existing = prev.findIndex(u => u.agent === data.agent)
                if (existing >= 0) {
                  const updated = [...prev]
                  updated[existing] = data
                  return updated
                }
                return [...prev, data]
              })

              if (data.done) {
                setIsLoading(false)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
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
    </div>
  )
}

export default App
