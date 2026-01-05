import './FinalInsights.css'

interface FinalInsightsProps {
  insights: string
}

function FinalInsights({ insights }: FinalInsightsProps) {
  return (
    <div className="final-insights-container">
      <div className="final-insights-header">
        <h2>✨ Final Insights & Principles</h2>
      </div>
      <div className="final-insights-content">
        {(() => {
          // Extract only the text content, strip any object metadata
          let cleanText = String(insights);
          
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
  )
}

export default FinalInsights

