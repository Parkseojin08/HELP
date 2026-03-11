import Style from "./auth.module.css";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import signin from '../../api/auth/signin';
//
import { useAuth } from "../../context/AuthContext";
import me from "../../api/auth/me";

export default function Signin(){
    const { setUserInfo } = useAuth();
    const navs = useNavigate();

    const [ email, setEmail ] = useState("");
    const [ password, setPassword ] = useState(""); 

    const check = async ( {email, password} ) => {
        const { success, message } = await signin({ email, password });
  
        alert(message);
        if(success){
            const data = await me();
            if(data?.success){
                setUserInfo(data.userInfo);
            }
            navs('/'); 
        }      
         
    }

    return(
        <div className={Style.box}>
            <div>
                <div >
                    <h1>Sign in</h1>
                </div>
            </div>
            <div className={Style.inputs}>
                <div className={Style.inputbox}>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" onChange={(value) => {setEmail(value.target.value)}} placeholder="16자 이하, 숫자 X"></input>
                </div>
                <div className={Style.inputbox}>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" onChange={(value) => {setPassword(value.target.value)}} placeholder="영어 + 숫자, 8 - 12"></input>
                </div>
            </div>
            <div className={Style.button}>
                <div>
                    <button onClick={() => {check({email, password})}}>sign in</button>
                </div>
                <div>
                    <button onClick={() => {navs("/auth/signup")}}>sign up</button>
                </div>
            </div>
        </div>
    )
}