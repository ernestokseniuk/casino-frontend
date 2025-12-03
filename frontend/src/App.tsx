import { AuthProvider } from './context/AuthContext'
import GamePage from './components/GamePage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <GamePage />
    </AuthProvider>
  )
}

export default App
