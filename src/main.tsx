import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens/tokens.css'
import './index.css'
import { Gate } from './Gate'
import { Routes } from './Routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Gate>
      <Routes />
    </Gate>
  </StrictMode>,
)
