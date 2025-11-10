import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {Loader} from "lucide-react"
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/SignUp'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { useAuth } from './store/Auth'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import { useThemeStore } from './store/useThemeStore'

function App() {
  const { authUser, checkAuth, isChecking } = useAuth() as { authUser: any; checkAuth: () => void; isChecking: boolean };
  const { theme } = useThemeStore() as { theme: string };
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
    console.log({ authUser });
    if(isChecking && !authUser) return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    )
  return (
   
   <div data-theme={theme}>
       <Navbar />
      <Routes>
        <Route path='/' element={authUser ? <Home /> : <Navigate to="/login" />} />
        <Route path='/login' element={!authUser ? <Login /> : <Navigate to="/" />} />
        <Route path='/signup' element={!authUser ? <Signup /> : <Navigate to="/" />} />
        <Route path='/profile' element={authUser ? <Profile /> : <Navigate to="/login" />} />
        <Route path='/settings' element={<Settings />} />

      </Routes>
  <Toaster />
    </div>
  )
}

export default App