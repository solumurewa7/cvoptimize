// App.jsx
//
// This is the ROOT of the entire React application.
// Every page, component, and piece of UI eventually lives inside here.
//
// Right now it's a simple placeholder that confirms the setup works.
// In Phase 9 we'll replace this with React Router for navigation between pages.

function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
    }}>
      {/* CVOptimize wordmark */}
      <h1 style={{ color: '#3b82f6', fontSize: '2.5rem', margin: '0 0 8px' }}>
        CVOptimize
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
        Frontend is running. Phase 1 complete.
      </p>
    </div>
  )
}

export default App
