"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface CatalogItem {
  title: string;
  category: string;
  condition: string;
  estValueCents: string;
}

const CATEGORIES = [
  "Furniture", "Electronics", "Art", "Antiques", "Clothing",
  "Jewelry", "Appliances", "Sporting Goods", "Collectibles", "Other",
];

const CONDITIONS = ["Like New", "Good", "Fair", "Worn"];

function emptyItem(): CatalogItem {
  return { title: "", category: "", condition: "", estValueCents: "" };
}

export default function CompleteWalkthroughForm({ clientId, clientName, onDone }: {
  clientId: string;
  clientName: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([emptyItem()]);

  function updateItem(idx: number, field: keyof CatalogItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    const validItems = items.filter((i) => i.title.trim());
    if (validItems.length === 0) {
      toast("Add at least one item", "error");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/walkthroughs/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        notes: notes || undefined,
        items: validItems.map((i) => ({
          title: i.title.trim(),
          category: i.category || undefined,
          condition: i.condition || undefined,
          estValueCents: i.estValueCents ? Math.round(parseFloat(i.estValueCents) * 100) : undefined,
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      toast(`Walkthrough completed — ${data.itemsCreated} item(s) cataloged`);
      onDone();
      router.refresh();
    } else {
      const err = await res.json();
      toast(err.errors?.[0] || "Failed to complete walkthrough", "error");
    }
    setSaving(false);
  }

  return (
    <div style={{ padding: 20, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
        Complete Walkthrough — {clientName}
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
          Walkthrough Notes
        </label>
        <textarea
          className="form-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Overall impressions, special considerations..."
          style={{ resize: "vertical" }}
        />
      </div>

      {/* Item catalog */}
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
        Items Cataloged
      </div>

      {items.map((item, idx) => (
        <div key={idx} style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, marginBottom: 8,
          alignItems: "end",
        }}>
          <div>
            {idx === 0 && <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Title *</label>}
            <input
              className="form-input"
              value={item.title}
              onChange={(e) => updateItem(idx, "title", e.target.value)}
              placeholder="e.g. Mid-century dresser"
            />
          </div>
          <div>
            {idx === 0 && <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Category</label>}
            <select className="form-input" value={item.category} onChange={(e) => updateItem(idx, "category", e.target.value)}>
              <option value="">—</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            {idx === 0 && <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Condition</label>}
            <select className="form-input" value={item.condition} onChange={(e) => updateItem(idx, "condition", e.target.value)}>
              <option value="">—</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            {idx === 0 && <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Est. Value ($)</label>}
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={item.estValueCents}
              onChange={(e) => updateItem(idx, "estValueCents", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <button
            type="button"
            onClick={() => removeItem(idx)}
            style={{
              background: "none", border: "none", color: "var(--red)", cursor: "pointer",
              fontSize: 18, padding: "4px 8px", opacity: items.length <= 1 ? 0.3 : 1,
            }}
            disabled={items.length <= 1}
          >
            x
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        style={{
          background: "none", border: "1px dashed var(--border)", borderRadius: 8,
          color: "var(--text-muted)", padding: "8px 16px", cursor: "pointer", fontSize: 13,
          width: "100%", marginBottom: 16,
        }}
      >
        + Add Item
      </button>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : `Complete (${items.filter((i) => i.title.trim()).length} items)`}
        </button>
      </div>
    </div>
  );
}
