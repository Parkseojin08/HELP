import Style from './SideBox.module.css';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import searchFriend from '../../api/search/friend/friendList';

export default function SideBox({ setChoice, choice, friendChange }) {
    const { userInfo } = useAuth();

    const [friendList, setFriendList] = useState();

    useEffect(() => {
        const request = async () => {
            const data = await searchFriend();
            if (data?.success) {
                setFriendList(data.data);
                return;
            }
            setFriendList([]);
        };
        request();
    }, [userInfo, friendChange]);

    return (
        <div className={Style.box}>
            <nav className={Style.basic} aria-label="메뉴">
                <button
                    type="button"
                    className={`${Style.tab} ${choice === 'chat' ? Style.tabActive : ''}`}
                    onClick={() => setChoice('chat')}
                >
                    <span className={`material-symbols-outlined ${Style.tabIcon}`} aria-hidden>
                        chat
                    </span>
                    <span className={Style.tabLabel}>chat</span>
                </button>
                <div className={Style.tabDivider} role="presentation" />
                <button
                    type="button"
                    className={`${Style.tab} ${choice === 'friend' || choice == null ? Style.tabActive : ''}`}
                    onClick={() => setChoice('friend')}
                >
                    <span className={`material-symbols-outlined ${Style.tabIcon}`} aria-hidden>
                        emoji_people
                    </span>
                    <span className={Style.tabLabel}>Friend</span>
                </button>
            </nav>
            <div className={Style.friend}>
                <div className={Style.title}>
                    <h3>Friend List</h3>
                </div>
                {friendList ? (
                    <div className={Style.list}>
                        {friendList?.map((friendInfo, index) => (
                            <div key={index + 1}>
                                <h4>
                                    {index + 1}. {friendInfo.username}
                                </h4>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
