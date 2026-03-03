import { getConversations } from "@/lib/queries";
import MessagesView from "./MessagesView";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const conversations = await getConversations();
  const serialized = JSON.parse(JSON.stringify(conversations));

  return (
    <>
      <div className="header">
        <div>
          <h1>Messages</h1>
          <div className="header-subtitle">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
      <MessagesView conversations={serialized} />
    </>
  );
}
