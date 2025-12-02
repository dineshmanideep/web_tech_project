// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './context/AppContext.tsx'
import './index.css'
import App from './App.tsx'
import { MessageProvider } from './context/MessageContext.tsx'
import { VideoCallProvider } from './context/VideoCallContext.tsx'
import { Toaster } from 'react-hot-toast'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <AppProvider>
      <MessageProvider>
        <VideoCallProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </VideoCallProvider>
      </MessageProvider>
    </AppProvider>
  // </StrictMode>,
)
