import Style from './FriendList.module.css';

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import searchFriend from '../../api/search/friend/friendList';
export default function FriendList({friendChange}){
    const {userInfo} = useAuth();

    const [friendList, setFriendList] = useState();

    useEffect(() => {
        const request = async () => {
            const data = await searchFriend();
            if(data?.success){
                setFriendList(data.data);
                return;
            }
            setFriendList([]);
        }
        request();
    },[userInfo, friendChange]);
    
    return(
        <div>
            {userInfo ? 
            <div className={Style.friend}>
                <div className={Style.title}>
                    <h4>Friend List</h4>   
                </div>
                {friendList ? 
                    <div className={Style.list}>   
                        {friendList?.map((friendInfo, index) => {
                            return(
                                <div key={index+1}>
                                    <h5>{index+1}. {friendInfo.username}</h5>
                                </div>
                                )
                            })
                        }
                    </div>
                :
                    <div className={Style.title}>
                        <h5>친구를 추가해보세요!</h5>    
                    </div>}
            </div>
            : null}
        </div>
    )
}