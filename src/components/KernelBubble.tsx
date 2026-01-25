import { useState, useEffect } from 'react'
import './KernelBubble.css'

interface KernelBubbleProps {
  isActive: boolean
}

interface StopHistoryEvent {
  timestamp: string
  action: string
  status: string
}

function KernelBubble({ isActive }: KernelBubbleProps) {
  const [isStopped, setIsStopped] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [stopHistory, setStopHistory] = useState<StopHistoryEvent[]>([])
  const [isStopping, setIsStopping] = useState(false)

  useEffect(() => {
    // Reset stop state when a new analysis starts
    if (isActive) {
      // New analysis started - reset all stop-related states immediately
      setIsStopped(false)
      setIsStopping(false)
    } else {
      // When analysis stops (isActive becomes false), clear stopping state
      setIsStopping(false)
    }
  }, [isActive])

  useEffect(() => {
    // Fetch stop history when expanded
    if (isExpanded) {
      fetchStopHistory()
    }
  }, [isExpanded])

  const fetchStopHistory = async () => {
    try {
      const backUrl = import.meta.env.VITE_BACK_URL || 'http://localhost:8000'
      const cleanUrl = backUrl.replace(/\/+$/, '')
      
      const response = await fetch(`${cleanUrl}/kernel/history`)
      if (response.ok) {
        const data = await response.json()
        setStopHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching stop history:', error)
    }
  }

  const handleDownloadExcel = async () => {
    try {
      const backUrl = import.meta.env.VITE_BACK_URL || 'http://localhost:8000'
      const cleanUrl = backUrl.replace(/\/+$/, '')
      
      const response = await fetch(`${cleanUrl}/kernel/history/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kernel_stop_history_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading Excel:', error)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return timestamp
    }
  }

  const handleHardStop = async () => {
    try {
      // Set stopping state immediately for instant UI feedback
      setIsStopping(true)
      console.log('Hard stop pressed, isStopping set to true')
      
      const backUrl = import.meta.env.VITE_BACK_URL || 'http://localhost:8000'
      const cleanUrl = backUrl.replace(/\/+$/, '')
      
      const response = await fetch(`${cleanUrl}/kernel/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setIsStopped(true)
        console.log('Stop command sent successfully, isStopped set to true')
        // Refresh history after stop
        await fetchStopHistory()
        // Keep expanded view open and loading state active until analysis stops
        // Don't close the expanded view - let user see the loading state
        // The loading will be cleared by the useEffect when isActive becomes false
      } else {
        console.error('Failed to send stop command')
        setIsStopping(false)
      }
    } catch (error) {
      console.error('Error activating hard stop:', error)
      setIsStopping(false)
    }
  }

  const handleReset = async () => {
    try {
      const backUrl = import.meta.env.VITE_BACK_URL || 'http://localhost:8000'
      const cleanUrl = backUrl.replace(/\/+$/, '')
      
      const response = await fetch(`${cleanUrl}/kernel/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setIsStopped(false)
        // Refresh history after reset (before closing)
        await fetchStopHistory()
        setIsExpanded(false)
      }
    } catch (error) {
      console.error('Error resetting kernel:', error)
    }
  }

  return (
    <div className={`kernel-bubble ${isStopped ? 'stopped' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="kernel-bubble-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse kernel controls' : 'Expand kernel controls'}
      >
        <div className="kernel-icon">⚙️</div>
        <span className="kernel-toggle-text">Kernel Setting</span>
        {isStopped && <div className="kernel-stop-indicator"></div>}
      </button>
      
      {isExpanded && (
        <div className="kernel-bubble-content">
          <div className="kernel-bubble-header">
            <h3>Kernel Control</h3>
            <button
              className="kernel-close"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          <div className="kernel-bubble-body">
            <p className="kernel-status">
              Status: <span className={isStopped || isStopping ? 'status-stopped' : 'status-active'}>
                {isStopping ? 'Stopping...' : isStopped ? 'Hard Stop Active' : 'Active'}
              </span>
            </p>
            
            {(isStopped || isStopping) && (
              <p className="kernel-hardstop-decided">
                {isStopping ? 'Stop command sent, waiting for current agent...' : 'Hardstop decided'}
              </p>
            )}
            
            <div className="kernel-actions">
              {isStopping ? (
                <button
                  className="kernel-button kernel-button-stop stopping"
                  disabled={true}
                >
                  <span className="kernel-button-spinner"></span>
                  Stopping...
                </button>
              ) : isStopped && isActive ? (
                <button
                  className="kernel-button kernel-button-stop stopping"
                  disabled={true}
                >
                  <span className="kernel-button-spinner"></span>
                  Waiting for agent to complete...
                </button>
              ) : !isStopped ? (
                <button
                  className={`kernel-button kernel-button-stop ${isActive ? 'active' : ''}`}
                  onClick={handleHardStop}
                  disabled={!isActive}
                >
                  🛑 Hard Stop
                </button>
              ) : (
                <button
                  className="kernel-button kernel-button-reset"
                  onClick={handleReset}
                >
                  ▶️ Reset & Continue
                </button>
              )}
            </div>
            
            <p className="kernel-info">
              {isStopping || (isStopped && isActive)
                ? 'Stop command sent. Analysis will stop after the current agent completes its work.'
                : isStopped
                ? 'Analysis has been stopped.'
                : 'Press Hard Stop to halt analysis after current agent.'}
            </p>
            
            <div className="kernel-history-section">
              <div className="kernel-history-header">
                <h4>Stop History</h4>
                {stopHistory.length > 0 && (
                  <button
                    className="kernel-download-btn"
                    onClick={handleDownloadExcel}
                    title="Download history as Excel"
                  >
                    📥 Download Excel
                  </button>
                )}
              </div>
              
              {stopHistory.length === 0 ? (
                <p className="kernel-history-empty">No stop events recorded yet.</p>
              ) : (
                <div className="kernel-history-list">
                  {stopHistory.slice().reverse().map((event, index) => (
                    <div key={index} className={`kernel-history-item ${event.action === 'stop' ? 'history-stop' : 'history-reset'}`}>
                      <div className="history-timestamp">{formatTimestamp(event.timestamp)}</div>
                      <div className="history-action">
                        {event.action === 'stop' ? '🛑 Stop' : '▶️ Reset'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KernelBubble
