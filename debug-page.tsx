'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('Component mounted');
    
    // Test API auth endpoint
    fetch('/api/auth/session')
      .then(res => {
        addLog(`Auth session response: ${res.status}`);
        return res.json();
      })
      .then(data => {
        addLog(`Auth session data: ${JSON.stringify(data)}`);
      })
      .catch(err => {
        addLog(`Auth session error: ${err.message}`);
      });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug - Befret Backoffice</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <pre className="text-sm">
          NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'undefined'}{'\n'}
          NODE_ENV: {process.env.NODE_ENV || 'undefined'}{'\n'}
          Firebase API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10)}...{'\n'}
        </pre>
      </div>

      <div className="bg-blue-100 p-4 rounded mt-4">
        <h2 className="font-semibold mb-2">Execution Logs:</h2>
        <div className="text-sm space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="font-mono">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}