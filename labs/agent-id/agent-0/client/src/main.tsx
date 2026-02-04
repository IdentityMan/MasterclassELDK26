import '@/styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MsalProvider } from '@azure/msal-react'

import App from '@/_app.tsx'
import { Toaster } from '@/components/ui'
import { EntraConfigError } from '@/config-error.tsx'
import { msalInstance } from '@/lib/auth'

const root = createRoot(document.getElementById('root') as HTMLElement)

const entraTenantId = import.meta.env.VITE_ENTRA_TENANT_ID
const entraClientId = import.meta.env.VITE_ENTRA_CLIENT_ID

root.render(
  <StrictMode>
    <BrowserRouter>
      {!entraTenantId || !entraClientId ? (
        <EntraConfigError />
      ) : (
        <MsalProvider instance={msalInstance}>
          <Toaster />
          <App />
        </MsalProvider>
      )}
    </BrowserRouter>
  </StrictMode>
)
