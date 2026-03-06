import { useNavigate } from 'react-router-dom';

export default function Main(){
    const navs = useNavigate();
    
    return(
        <div>
            <h3>로그인</h3>
            <button onClick={() => {navs("/auth/signin")}}>로그인</button>
            <h3>회원가입</h3>
            <button onClick={() => {navs("/auth/signup")}}>회원가입</button>
        </div>
    )
}