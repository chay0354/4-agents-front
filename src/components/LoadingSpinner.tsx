import './LoadingSpinner.css'

function LoadingSpinner() {
  return (
    <div className="loading-spinner-container">
      <div className="spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-text">Analyzing with AI Agents...</p>
    </div>
  )
}

export default LoadingSpinner


