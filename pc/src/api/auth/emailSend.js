import axios from "axios"

const emailSend = async ({email}) => {
    try{
        const request = await axios.post('/auth/email-send',{email});
        return request.data;
    }catch(err){
        return{
            success: false,
            message: err?.response?.data?.message || "서버 오류"
        }
    }
}

export default emailSend;