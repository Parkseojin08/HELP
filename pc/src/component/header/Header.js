import Style from "./Header.module.css"
import { useNavigate } from 'react-router-dom';

export default function Header({user}){
    const navs = useNavigate();

    return(
        <header className={Style.headermain}>
            <div className={Style.area}>
                <h4 className={Style.curser} onClick={() => {navs("/")}}>Messenger</h4>
            </div>
            <div className={Style.area}>
                {user ? 
                    <div>
                        <h4>{user}</h4>
                    </div>
                    :
                    <div className={Style.btn}>
                        <div>
                            <button onClick={() => navs("/auth/signin")}>로그인</button>
                        </div>
                        <div>
                            <button onClick={() => navs("/auth/signup")}>회원가입</button>
                        </div>
                    </div>
                }
            </div>
        </header>
    )
}