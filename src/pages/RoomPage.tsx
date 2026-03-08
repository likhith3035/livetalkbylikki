import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatPage from "./ChatPage";

const RoomPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Store room code so ChatPage can pick it up
      sessionStorage.setItem("echo_join_room", code.toUpperCase());
    }
  }, [code]);

  // Render ChatPage which will detect the room code
  return <ChatPage />;
};

export default RoomPage;
