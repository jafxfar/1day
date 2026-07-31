import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'
import '@fontsource-variable/manrope'
import { AppProviders } from './app/AppProviders'
import './index.css'
import './shared/lib/theme'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found')
}

ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
)