import Style from "./auth.module.css";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import signup from '../../api/auth/signup';

export default function Signup(){

    const navs = useNavigate();

    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState(""); 
    const [ email, setEmail ]  = useState("");

    const check = async ( username, password, email) => {
        const { success, message } = await signup({ username, password, email });
  
        alert(message);
        if(success){
            navs('/auth/signin');
        }        
    }
    
    return(
        <div className={Style.box}>
            <div>
                <div >
                    <h1>Sign up</h1>
                </div>
            </div>
            <div className={Style.inputs}>
                <div className={Style.inputbox}>
                    <label htmlFor="username">username:</label>
                    <input type="text" id="username" onChange={(value) => {setUsername(value.target.value)}} placeholder="16자 이하, 숫자 X"></input>
                </div>
                <div className={Style.inputbox}>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" onChange={(value) => {setPassword(value.target.value)}} placeholder="영어 + 숫자, 8 - 12"></input>
                </div>
                    <div className={Style.inputbox}>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" onChange={(value) => {setEmail(value.target.value)}} placeholder="이메일 형식을 입력해주세요"></input>
                </div>
            </div>
            <div className={Style.button}>
                <div>
                    <button onClick={() => {check(username, password, email)}}>sign up</button>
                </div>
                <div>
                    <button onClick={() => {navs("/auth/signin")}}>sign in</button>
                </div>
            </div>
        </div>
    )
}