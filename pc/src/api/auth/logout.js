import axios from "axios";

const logOut = async () => {
    try{
        const request = await axios.post("/auth/logout", {}, { withCredentials: true });
        return request.data;
    }catch(err){
        return {
            success: false,
            message: "서버 오류"
        };
    }
}

export default logOut;