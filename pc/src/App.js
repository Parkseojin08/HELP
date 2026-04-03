import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import style from './App.module.css'; 

//auth
import me from './api/auth/me';
import { useAuth } from './context/AuthContext';

// component
import Header from './component/header/Header.jsx';
import Main from './page/main/Main.jsx';
import Signup from './page/auth/Signup.jsx';
import Signin from './page/auth/Signin.jsx';

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
        <Routes>
          <Route index element={<Main/>}/>
          <Route path='/auth/signin' element={<Signin/>}/>
          <Route path='/auth/signup' element={<Signup/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
