import { createContext, useContext ,useState } from "react";

// context 생성
const AuthContext = createContext(null);

// Provider
export function AuthProvider({children}){
    const [userInfo, setUserInfo] = useState();

    return(
        <AuthContext.Provider value = {{userInfo, setUserInfo}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);   