import React from 'react';

console.log('📦 App component loading...');

function App() {
  console.log('🎯 App component rendering...');

  // Start with a very simple component
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#e0e5ec',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '8px 8px 16px #b8b9be, -8px -8px 16px #ffffff',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h1 style={{
          color: '#333',
          fontSize: '28px',
          marginBottom: '16px',
          fontWeight: 'bold'
        }}>
          🎉 Alpha Edge Platform
        </h1>
        <p style={{
          color: '#666',
          fontSize: '16px',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          Welcome to the Global Elite Trader Platform!
          The platform is working and loading successfully.
        </p>
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>✅ Status:</strong> Platform loaded successfully<br/>
          <strong>🔧 Version:</strong> Alpha Edge v1.0.0<br/>
          <strong>🎨 UI:</strong> Neumorphic Design Active
        </div>
        <button
          style={{
            backgroundColor: '#e0e5ec',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '4px 4px 8px #b8b9be, -4px -4px 8px #ffffff',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseDown={(e) => {
            e.target.style.boxShadow = 'inset 2px 2px 4px #b8b9be, inset -2px -2px 4px #ffffff';
          }}
          onMouseUp={(e) => {
            e.target.style.boxShadow = '4px 4px 8px #b8b9be, -4px -4px 8px #ffffff';
          }}
          onClick={() => {
            console.log('🔄 Reloading page...');
            window.location.reload();
          }}
        >
          🔄 Reload Platform
        </button>
      </div>
    </div>
  );
}

export default App;
