import Style from "./auth.module.css";

import { useNavigate } from 'react-router-dom';

export default function Signin(){
    const navs = useNavigate();

    return(
        <div className={Style.box}>
            <div>
                <div >
                    <h1>Sign in</h1>
                </div>
            </div>
            <div className={Style.inputs}>
                <div className={Style.inputbox}>
                    <label htmlFor="username">ID:</label>
                    <input type="text" id="username"></input>
                </div>
                <div className={Style.inputbox}>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password"></input>
                </div>
            </div>
            <div className={Style.button}>
                <div>
                    <button>sign in</button>
                </div>
                <div>
                    <button onClick={() => {navs("/auth/signup")}}>sign up</button>
                </div>
            </div>
        </div>
    )
}