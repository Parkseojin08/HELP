import axios from "axios";

const searchFriend = async ({email}) => {
    try{
        const request = await axios.get('/search/friend',{ 
            params: { email },
            withCredentials: true 
        });
        return request.data;
    } catch(err){
        return {
            success: false, 
            message: err?.response?.data.message || "서버오류"
        };
    }
}

export default searchFriend;
