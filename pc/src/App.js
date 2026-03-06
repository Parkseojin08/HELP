import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import style from './App.module.css'; 

// component
import Header from './component/header/Header.jsx';
import Main from './component/main/Main.jsx';
import Signup from './component/auth/Signup.jsx';
import Signin from './component/auth/Signin.jsx';
function App() {

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
