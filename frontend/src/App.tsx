import { AuthProvider } from './context/AuthContext'
import { ADHDProvider } from './context/ADHDContext'
import GamePage from './components/GamePage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <ADHDProvider>
        <GamePage />
      </ADHDProvider>
    </AuthProvider>
  )
}

export default App
