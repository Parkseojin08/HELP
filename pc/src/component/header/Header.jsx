import Style from "./Header.module.css"
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react"; 
//auth
import me from "../../api/auth/me";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import logout from "../../api/auth/logout";

export default function Header(){
    const navs = useNavigate();
    const { userInfo, setUserInfo } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tokenCheck = async () => {
            const data = await me();
            if(data?.success){
                setUserInfo(data.userInfo);
            }
        }
        tokenCheck();
    }, []);

    const setting = async () => {
        const request = await logout();
        setUserInfo(null);
        if(request.success){
            alert(request.message)
        }
    };

    return(
        <header className={Style.headermain}>
            <div className={`${Style.area} ${Style.start}`}>
                <h4 className={Style.curser} onClick={() => {navs("/")}}>Messenger</h4>
            </div>
            <div className={`${Style.area} ${Style.end}`}>
                <button 
                    className={Style.themeToggle} 
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
                {userInfo?.user_id ? 
                    <div className={Style.btn}>
                        <div>
                            <button>
                                {userInfo.username}
                            </button>
                        </div>
                        <div>
                            <button onClick={() => {setting()}}>
                                OUT
                            </button>
                        </div>
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