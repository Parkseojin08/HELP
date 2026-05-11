import { io } from "socket.io-client";

let socket;

export function getSocket(){
  if (!socket){
    socket = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"],
    });
  }
  return socket;
}

