import { useState } from 'react'
import { LandingPage } from './components/LandingPage'
import { GameScreen } from './components/GameScreen'
import { GameProvider } from './contexts/GameContext'
import './App.css'

function App() {
  const [started, setStarted] = useState(false)

  return (
    <GameProvider>
      {started ? <GameScreen /> : <LandingPage onStart={() => setStarted(true)} />}
    </GameProvider>
  )
}

export default App
