import axios from 'axios';

export default function functions(){
    const test = async () => {
        try{
            const date = await axios.get("/test");
            return date;
        } catch(err){
            console.error(err.response);
        }
    }

    return {test};
}