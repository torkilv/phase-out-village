import { useState } from 'react'
import { LandingPage } from './components/LandingPage'
import { GameScreen } from './components/GameScreen'
import './App.css'

function App() {
  const [started, setStarted] = useState(false)

  return started ? <GameScreen /> : <LandingPage onStart={() => setStarted(true)} />
}

export default App
