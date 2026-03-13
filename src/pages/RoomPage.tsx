import { useParams } from "react-router-dom";
import ChatPage from "./ChatPage";
import { useSEO } from "@/hooks/use-seo";

const RoomPage = () => {
  const { code } = useParams<{ code: string }>();
  useSEO({ 
    title: `Private Room: ${code?.toUpperCase()}`, 
    description: "Join this private encrypted chat room on LiveTalk. Secure and anonymous conversation with a friend.",
    keywords: "private chat room, encrypted room, chat with friend, secure room code, anonymous private chat"
  });

  // Pass code directly for reliable deep-link room auto-join
  return <ChatPage initialRoomCode={code?.toUpperCase()} />;
};

export default RoomPage;
