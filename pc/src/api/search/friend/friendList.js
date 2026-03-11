import axios from "axios";

const searchFriend = async () => {
    try{
        const request = await axios.get('/search/friendlist',{
            withCredentials: true 
        });
        return request.data;
    } catch(err){
        return {
            success: false, 
            message: "서버오류"
        };
    }
}
    
export default searchFriend;
