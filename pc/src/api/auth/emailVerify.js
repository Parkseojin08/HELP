import axios from "axios"

const emailVerify = async ({email, code}) => {
    try{
        const request = await axios.post('/auth/email-verify', {email, code})
        return request.data
    }catch(err){
        return{
            success: false,
            message: err?.response?.data?.message || "서버오류"
        }
    }
}

export default emailVerify;