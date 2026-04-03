import axios from "axios";

const me = async () => {
    try{
        const response = await axios.get("/auth/me", { withCredentials: true });
        return response.data;
    }catch(err){
        return{
            success: false,
            userInfo: null
        };
    }
}   

export default me;