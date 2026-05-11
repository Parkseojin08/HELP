import axios from "axios";

export async function listRooms(){
  const res = await axios.get("/chat/rooms", { withCredentials: true });
  return res.data;
}

export async function createDirectRoom(friend_id){
  const res = await axios.post(
    "/chat/rooms/direct",
    { friend_id },
    { withCredentials: true }
  );
  return res.data;
}

export async function getRoom(roomId){
  const res = await axios.get(`/chat/rooms/${roomId}`, { withCredentials: true });
  return res.data;
}

