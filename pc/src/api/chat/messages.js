import axios from "axios";

export async function listMessages(roomId, { before, limit } = {}){
  const params = new URLSearchParams();
  if (before) params.set("before", String(before));
  if (limit) params.set("limit", String(limit));

  const qs = params.toString();
  const res = await axios.get(`/chat/messages/${roomId}${qs ? `?${qs}` : ""}`, {
    withCredentials: true,
  });
  return res.data;
}

export async function markRead(roomId, message_id){
  const res = await axios.post(
    `/chat/messages/${roomId}/read`,
    { message_id },
    { withCredentials: true }
  );
  return res.data;
}

