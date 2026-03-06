import axios from 'axios';

const signin = async ( {email, password} ) =>{
    try{
        const request = await axios.post("/auth/signin",
            { email, password }
        );
        
        return request.data;

    } catch(err){
        console.error(err.message)
        if(err.response){
            return err.response.data;
        }

        return {
            success: false,
            message: "서버오류"
        }   
    }
}


export default signin;