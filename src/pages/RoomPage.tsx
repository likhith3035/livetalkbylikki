import { useParams } from "react-router-dom";
import ChatPage from "./ChatPage";

const RoomPage = () => {
  const { code } = useParams<{ code: string }>();

  // Pass code directly for reliable deep-link room auto-join
  return <ChatPage initialRoomCode={code?.toUpperCase()} />;
};

export default RoomPage;
