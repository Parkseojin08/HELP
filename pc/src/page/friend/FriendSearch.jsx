import Style from './FriendSearch.module.css';

import { useState } from "react"
import searchFriend from "../../api/search/friend/friend";
import { useAuth } from "../../context/AuthContext";

import friendAdd from '../../api/add/friend';

export default function FriendSearch({setFriendChange}){
    const [ email, setEmail] = useState();
    const [ result, setResult ] = useState();
    
    const { userInfo } = useAuth();

    const searchFunction = async ({email}) => {
        const data = await searchFriend({email});
        setResult(data);
    }

    const friendAddFunction = async (friend_id) => {
        const data = await friendAdd({friend_id});
        if(data?.success === false){
            alert(data.message);
        }else{
            alert(data.message);
            setFriendChange((value) => !value);
        }
    }

    return(
        <div className={Style.main_box}>
            {userInfo ?     
                <div className={Style.height_size}>
                    <div className={Style.searchBox}>
                        <div className={Style.inputBox}>
                            <input type="search" 
                                onChange={(value) => setEmail(value.target.value)}
                                onKeyDown={async (e) => {
                                    if(e.key === 'Enter'){
                                        searchFunction({email});
                                    }
                                }}/>
                        </div>
                        <div className={Style.btn}>
                            <button onClick={() => searchFunction({email})}>검색</button>
                        </div>
                    </div>
                    <div>
                        {result?.data ? 
                        <div>
                            <div>
                                <h3>Name: {result.data.username}</h3>
                            </div>
                            <div>
                                <h4>Email: {result.data.email}</h4>
                            </div>
                            <div>
                                <h4>created_at: {result.data.created_at.split('T')[0]}</h4>
                            </div>
                            <div>
                                <button type="button" onClick={() => {friendAddFunction(result.data.user_id)}}>친구 추가</button>
                            </div>
                        </div>
                        : 
                        !result?.success && result  ?
                        <div>
                            <h3>{result?.message}</h3>
                        </div>
                        : 
                        <div className={Style.center}>
                            <h3>친구를 검색해보세요!</h3>
                        </div>
                        }
                    </div>
                </div>
                : null}
        </div>
    )
}