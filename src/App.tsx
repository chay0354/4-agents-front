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

    try {
      let backUrl = import.meta.env.VITE_BACK_URL || 'http://127.0.0.1:8000'
      backUrl = backUrl.replace(/\/+$/, '')
      
      const agents = [
        { name: 'analysis', stage: 1, endpoint: '/agent/analysis' },
        { name: 'research', stage: 2, endpoint: '/agent/research' },
        { name: 'critic', stage: 3, endpoint: '/agent/critic' },
        { name: 'monitor', stage: 4, endpoint: '/agent/monitor' },
        { name: 'ratings', stage: 5, endpoint: '/agent/ratings' },
        { name: 'summary', stage: 6, endpoint: '/agent/summary' }
      ]
      
      const context: any = { problem }
      const allResponses: any = {}
      
      for (const agent of agents) {
        const timestamp = new Date().toLocaleTimeString()
        const agentDisplayName = agent.name.charAt(0).toUpperCase() + agent.name.slice(1) + ' Agent'
        
        // Show agent as thinking
        console.log(`[${timestamp}] 🟢 FRONTEND: ${agentDisplayName} STARTING...`)
        setAgentUpdates(prev => {
          const existing = prev.findIndex(u => u.agent === agent.name)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = { ...updated[existing], status: 'thinking' }
            return updated
          }
          return [...prev, {
            agent: agent.name,
            stage: agent.stage,
            status: 'thinking',
            message: `${agentDisplayName} is processing...`
          }]
        })
        
        try {
          // Call agent endpoint
          const response = await fetch(`${backUrl}${agent.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problem,
              context: { ...context, all_responses: allResponses }
            })
          })
          
          if (!response.ok) {
            throw new Error(`Agent ${agent.name} failed: ${response.statusText}`)
          }
          
          const result = await response.json()
          
          // Check if stopped by kernel
          if (result.status === 'stopped') {
            console.log(`[${timestamp}] 🛑 FRONTEND: ${agentDisplayName} STOPPED by kernel`)
            setAgentUpdates(prev => {
              const existing = prev.findIndex(u => u.agent === agent.name)
              if (existing >= 0) {
                const updated = [...prev]
                updated[existing] = { ...updated[existing], status: 'error', message: result.message }
                return updated
              }
              return [...prev, {
                agent: agent.name,
                stage: agent.stage,
                status: 'error',
                message: result.message
              }]
            })
            setIsLoading(false)
            return
          }
          
          // Agent completed successfully
          if (result.status === 'complete' && result.response) {
            allResponses[agent.name] = result.response
            context[agent.name] = result.response
            
            // For ratings agent, also add to context with proper key
            if (agent.name === 'ratings') {
              context['ratings'] = result.response
            }
            
            // For summary, include all responses including ratings
            if (agent.name === 'summary') {
              context['all_responses'] = allResponses
            }
            
            const endTimestamp = new Date().toLocaleTimeString()
            console.log(`[${endTimestamp}] ✅ FRONTEND: ${agentDisplayName} FINISHED (response: ${result.response.length} chars)`)
            
            // Update state to show completed agent with response
            setAgentUpdates(prev => {
              const existing = prev.findIndex(u => u.agent === agent.name)
              if (existing >= 0) {
                const updated = [...prev]
                updated[existing] = {
                  ...updated[existing],
                  status: 'complete',
                  response: result.response
                }
                return updated
              }
              return [...prev, {
                agent: agent.name,
                stage: agent.stage,
                status: 'complete',
                response: result.response
              }]
            })
            
            // If this is the summary, we're done
            if (agent.name === 'summary') {
              setIsLoading(false)
            }
          }
        } catch (error) {
          console.error(`Error calling ${agent.name} agent:`, error)
          setAgentUpdates(prev => {
            const existing = prev.findIndex(u => u.agent === agent.name)
            if (existing >= 0) {
              const updated = [...prev]
              updated[existing] = { ...updated[existing], status: 'error', message: String(error) }
              return updated
            }
            return [...prev, {
              agent: agent.name,
              stage: agent.stage,
              status: 'error',
              message: String(error)
            }]
          })
          setIsLoading(false)
          return
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
