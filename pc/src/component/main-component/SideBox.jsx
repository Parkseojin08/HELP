import Style from './SideBox.module.css';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import searchFriend from '../../api/search/friend/friendList';

export default function SideBox({setChoice, friendChange}){
    const {userInfo} = useAuth();

    const [friendList, setFriendList] = useState();

    useEffect(() => {
        const request = async () => {
            const data = await searchFriend();
            if(data?.success){
                setFriendList(data.data);
                return;
            }
            setFriendList([])
        }
        request();
    },[userInfo, friendChange]);

    return(
        <div className={Style.box}>
            <div className={Style.basic}>
                <div>
                    <h3 onClick={() => setChoice('chat')}>chat</h3>
                </div>
                <div>
                    <h3 onClick={() => setChoice('friend')}>Friend</h3>
                </div>
            </div>
            <div className={Style.friend}>
                <div className={Style.title}>
                    <h3>Friend List</h3>
                </div>
                {friendList ? 
                <div className={Style.list}>
                    {friendList?.map((friendInfo, index) => {
                        return(
                        <div key={index+1}>
                            <h4>{index+1}. {friendInfo.username}</h4>
                        </div>
                        )
                    })
                    }
                </div>
                :
                null
                }
                
            </div>
        </div>
    )
}