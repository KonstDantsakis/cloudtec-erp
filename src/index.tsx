import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'
import { AuthProvider } from './context/AuthContext'

import App from './App'
import store from './store'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    {/* ✅ AuthProvider MUST wrap App here, not inside App.tsx */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>
)
