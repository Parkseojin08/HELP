import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import style from './App.module.css'; 
import functions from './functions.js';

// component
import Header from './component/header/Header.js';
import Main from './component/main/Main.js';
import Signup from './component/auth/Signup.js';
import Signin from './component/auth/Signin.js';
function App() {
  const [user, setUser] = useState(null);

  
  useEffect(() => {
    const { test } = functions();
    const func = async () => {
      const data = await test();
      console.log(data);
      return data.data.id;
    }
    setUser(func());
  }, []);

  return (
    <div className={style.main}>
      <BrowserRouter>
        <Header user={user}/>
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
