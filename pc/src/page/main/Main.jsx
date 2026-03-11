import Style from './Main.module.css';

import SideBox from '../../component/main-component/SideBox';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';



// search page
import FriendSearch from '../friend/FriendSearch';
import FriendList from '../../component/main-component/FriendList';

export default function Main(){
    const { userInfo } = useAuth();

    const [choice, setChoice] = useState();

    const [friendChange, setFriendChange] = useState(false);

    return(
        <main className={Style.MainBox}>
            <div className={Style.size20}>
                {userInfo ?
                    <SideBox setChoice = {setChoice} friendChange = {friendChange}/>
                :
                <div>
                </div>
                }
            </div>
            <div className={Style.content}>
                {(userInfo && choice === 'chat') ? 
                    <div>
                        <h4>chat</h4>
                    </div> 
                    :
                    <div className={Style.flexBox}>
                        <div className={Style.size20}>
                            <FriendList friendChange = {friendChange} />
                        </div>
                        <div className={Style.size80}>
                            <FriendSearch setFriendChange = {setFriendChange} />
                        </div>
                    </div>
                    }
            </div>
        </main>
    )
}