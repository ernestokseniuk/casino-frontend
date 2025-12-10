import { AuthProvider } from './context/AuthContext'
import { ADHDProvider } from './context/ADHDContext'
import { LipkoProvider } from './context/LipkoContext'
import GamePage from './components/GamePage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <ADHDProvider>
        <LipkoProvider>
          <GamePage />
        </LipkoProvider>
      </ADHDProvider>
    </AuthProvider>
  )
}

export default App
