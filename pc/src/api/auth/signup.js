import axios from 'axios';

const signup = async ({username, password, email}) => {
    try{
        const request = await axios.post("/auth/signup",
            {username, password, email}
        );
        return request.data;
    }catch(err){

        if(err.response){
            return err.response.data;
        }

        return {
            success:false,
            message:"서버 연결 실패"
        };
    }
}

export default signup;
