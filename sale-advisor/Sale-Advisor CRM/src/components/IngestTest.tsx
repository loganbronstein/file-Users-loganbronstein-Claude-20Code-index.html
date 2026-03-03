"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IngestTest() {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/leads/import`
    : "/api/leads/import";

  function copyUrl() {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function testIngest() {
    setTesting(true);
    setResult(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Lead " + new Date().toLocaleTimeString(),
          phone: "312-555-" + String(Math.floor(Math.random() * 9000) + 1000),
          source: "WEBSITE",
          neighborhood: "Chicago",
          itemsDescription: "Sample items from test ingest",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(`Created: ${data.name}`);
        router.refresh();
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Failed to reach endpoint");
    }

    setTesting(false);
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="card-header">
        <div className="card-title">🔧 Dev Tools — Lead Ingest Webhook</div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <code style={{
            flex: 1, padding: "8px 12px", background: "var(--bg-primary)",
            borderRadius: 6, fontSize: 12, color: "var(--text-secondary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            POST {webhookUrl}
          </code>
          <button className="btn btn-secondary" onClick={copyUrl} style={{ fontSize: 12 }}>
            {copied ? "Copied!" : "Copy URL"}
          </button>
          <button className="btn btn-primary" onClick={testIngest} disabled={testing} style={{ fontSize: 12 }}>
            {testing ? "Sending..." : "Create Test Lead"}
          </button>
          {result && (
            <span style={{ fontSize: 12, color: result.startsWith("Error") ? "var(--red)" : "var(--green)" }}>
              {result}
            </span>
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
          External webhook requires <code>X-INGEST-SECRET</code> header. Use the &quot;Create Test Lead&quot; button for quick testing.
        </div>
      </div>
    </div>
  );
}
