export const EntraConfigError = () => {
  const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID
  const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID

  const missingVars = []
  if (!tenantId) missingVars.push('VITE_ENTRA_TENANT_ID')
  if (!clientId) missingVars.push('VITE_ENTRA_CLIENT_ID')

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center p-4">
      <div className="bg-card rounded-lg p-8 shadow-lg">
        <h1 className="text-foreground mb-4 text-2xl font-bold">
          Entra ID Configuration Error
        </h1>
        <p className="text-muted-foreground mb-4">
          Microsoft Entra ID is not properly configured.
        </p>
        <div className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 font-mono text-sm">
          <p className="font-semibold">Missing environment variables:</p>
          <ul className="mt-2 list-inside list-disc">
            {missingVars.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          Add these variables to your <code className="bg-muted rounded px-1">.env</code> file in the client folder.
        </p>
        <a
          href="https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-single-page-app-react-sign-in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          View Entra ID Configuration Guide
        </a>
      </div>
    </div>
  )
}
