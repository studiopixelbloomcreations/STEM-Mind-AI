import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const quietPuter = () => {
  if (typeof window !== 'undefined' && window.puter) {
    window.puter.quiet = true
  }
}
quietPuter()
window.addEventListener('load', quietPuter)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
