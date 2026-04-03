import Style from "./Header.module.css"
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react"; 
//auth
import me from "../../api/auth/me";
import { useAuth } from "../../context/AuthContext";
import logout from "../../api/auth/logout";

export default function Header(){
    const navs = useNavigate();
    const { userInfo, setUserInfo } = useAuth();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tokenCheck = async () => {
            const data = await me();
            if(data?.success){
                setUserInfo(data.userInfo);
            }
            setTimeout(() => {
                setLoading(false);
            }, 1000);
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
            <div className={Style.area}>
                <h4 className={Style.curser} onClick={() => {navs("/")}}>Messenger</h4>
            </div>
            <div className={Style.area}>
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
                    loading ? 
                        null 
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