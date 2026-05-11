import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState, lazy } from 'react';
import style from './App.module.css'; 
import { Suspense } from "react";
//auth
import me from './api/auth/me';
import { useAuth } from './context/AuthContext';

// component
import Header from './component/header/Header.jsx';

// Lazy load pages
const Main = lazy(() => import('./page/main/Main.jsx'));
const Signup = lazy(() => import('./page/auth/Signup.jsx'));
const Signin = lazy(() => import('./page/auth/Signin.jsx'));

// Loading component
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontSize: '18px',
    }}>
      <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
        Loading...
      </div>
    </div>
  );
}

//authcontext
function App() {
  const { setUserInfo } = useAuth();

  const tokenCheck = async () => {
    const data = await me();
    if(data?.success){
      setUserInfo(data.userInfo);
    }
  }

  useEffect(() => {
    tokenCheck()
    
    const check = setInterval(() => {
      tokenCheck();
    }, 1000 * 60 * 14);
    return () => clearInterval(check);
  }, []);
  return (
    <div className={style.main}>
      <BrowserRouter>
        <Header/>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route index element={<Main/>}/>
            <Route path='/auth/signin' element={<Signin/>}/>
            <Route path='/auth/signup' element={<Signup/>}/>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  );
}

export default App;
