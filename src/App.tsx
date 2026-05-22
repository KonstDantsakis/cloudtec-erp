import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { LocaleProvider } from './context/LocaleContext'
import { AppRouter } from './app/Router'
import './styles.css'

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </LocaleProvider>
  )
}
