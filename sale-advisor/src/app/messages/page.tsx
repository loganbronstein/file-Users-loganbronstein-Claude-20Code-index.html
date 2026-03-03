import { getMessageThreads } from "@/lib/queries";
import MessagesView from "./MessagesView";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const threads = await getMessageThreads();
  const serialized = JSON.parse(JSON.stringify(threads));

  return (
    <>
      <div className="header">
        <div>
          <h1>Messages</h1>
          <div className="header-subtitle">{threads.length} conversation{threads.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <MessagesView threads={serialized} />
    </>
  );
}
