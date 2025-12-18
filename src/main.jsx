import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Debug logging
console.log('🚀 Alpha Edge starting...');

// First, try to render a simple test component
const TestComponent = () => {
  console.log('✅ TestComponent rendering');
  return React.createElement('div', {
    style: {
      padding: '20px',
      backgroundColor: '#f0f0f0',
      color: '#333',
      fontSize: '18px',
      textAlign: 'center'
    }
  }, '🚀 Alpha Edge is loading...');
};

try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', !!rootElement);

  if (!rootElement) {
    console.error('❌ Root element not found!');
    document.body.innerHTML = '<div style="color:red;padding:20px;">Error: Root element not found</div>';
  } else {
    console.log('✅ Root element found, rendering test component...');

    // First render a simple test
    ReactDOM.createRoot(rootElement).render(
      React.createElement(TestComponent)
    );

    // After a short delay, try to render the full app
    setTimeout(() => {
      console.log('🔄 Attempting to render full app...');
      try {
        ReactDOM.createRoot(rootElement).render(
          React.createElement(React.StrictMode, null,
            React.createElement(App)
          )
        );
        console.log('✅ Full app rendered successfully');
      } catch (appError) {
        console.error('❌ Error rendering full app:', appError);
        rootElement.innerHTML = `
          <div style="color:red;padding:20px;text-align:center;">
            <h2>App Loading Error</h2>
            <p>${appError.message}</p>
            <pre style="background:#f5f5f5;padding:10px;margin:10px 0;border-radius:4px;text-align:left;">${appError.stack}</pre>
          </div>
        `;
      }
    }, 100);
  }
} catch (error) {
  console.error('❌ Critical error during initialization:', error);
  document.body.innerHTML = `
    <div style="color:red;padding:20px;text-align:center;">
      <h1>Critical Loading Error</h1>
      <p>${error.message}</p>
    </div>
  `;
}

// Add error boundary for debugging
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});
