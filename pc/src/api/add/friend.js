import axios from "axios";

const friend = async ({friend_id}) => {
    try{
        const request = await axios.post('/add/friend', {friend_id}, {withCredentials: true});
        return request.data;
    }catch(err){
        return{success: false, message: err.response?.data?.message || "서버 오류"}
    }
}
export default friend;