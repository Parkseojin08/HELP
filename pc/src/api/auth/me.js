import axios from "axios";

const me = async () => {
    const token = await axios.get("/auth/me", { withCredentials: true });

}   

export default me;