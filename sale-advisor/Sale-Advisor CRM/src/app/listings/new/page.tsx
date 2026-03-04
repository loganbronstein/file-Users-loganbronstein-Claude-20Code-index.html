"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const VALID_MARKETPLACES = ["facebook", "ebay", "craigslist", "offerup"];

export default function NewListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [marketplaces, setMarketplaces] = useState<string[]>(["facebook", "ebay", "craigslist", "offerup"]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.ok) {
          setImages((prev) => [...prev, data.url]);
        } else {
          alert(data.errors?.join(", ") || "Upload failed");
        }
      } catch {
        alert("Upload error");
      }
    }

    setUploading(false);
  }

  async function handleGenerate() {
    if (images.length === 0) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/listings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: images }),
      });
      const data = await res.json();
      if (data.ok) {
        setTitle(data.details.title);
        setDescription(data.details.description);
        setPriceDollars((data.details.priceCents / 100).toFixed(2));
        setCategory(data.details.category);
        setCondition(data.details.condition);
      } else {
        alert(data.errors?.join(", ") || "AI generation failed");
      }
    } catch {
      alert("Generation error");
    }

    setGenerating(false);
  }

  async function handleSave(approve: boolean) {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    setSaving(true);

    try {
      // Create the listing
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priceCents: Math.round(parseFloat(priceDollars || "0") * 100),
          category: category || null,
          condition: condition || null,
          images,
          marketplaces,
          source: "UPLOAD",
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        alert(data.errors?.join(", ") || "Failed to create listing");
        setSaving(false);
        return;
      }

      // If approve, trigger approval
      if (approve && data.listing.id) {
        const approveRes = await fetch(`/api/listings/${data.listing.id}/approve`, { method: "POST" });
        const approveData = await approveRes.json();
        if (!approveData.ok) {
          alert("Listing saved as draft. Approval failed: " + (approveData.errors?.join(", ") || "Unknown error"));
        }
      }

      router.push("/listings");
    } catch {
      alert("Save error");
    }

    setSaving(false);
  }

  function toggleMarketplace(mp: string) {
    setMarketplaces((prev) =>
      prev.includes(mp) ? prev.filter((m) => m !== mp) : [...prev, mp],
    );
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <>
      <div className="header">
        <div>
          <h1>New Listing</h1>
          <div className="header-subtitle">Upload photos and create a marketplace listing</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left — Image Upload */}
        <div className="card" style={{ padding: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Photos</div>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent)"; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border)"; handleUpload(e.dataTransfer.files); }}
            style={{
              border: "2px dashed var(--border)",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 14,
              marginBottom: 16,
              transition: "border-color 0.2s",
            }}
          >
            {uploading ? "Uploading..." : "Click or drag photos here"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              style={{ display: "none" }}
            />
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }}
                  />
                  <button
                    onClick={() => removeImage(i)}
                    style={{
                      position: "absolute", top: 4, right: 4, width: 20, height: 20,
                      borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)",
                      color: "#fff", cursor: "pointer", fontSize: 12, display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* AI Generate button */}
          {images.length > 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                marginTop: 16, width: "100%", padding: "12px 16px", borderRadius: 8,
                border: "none", background: "var(--blue)", color: "#fff",
                cursor: generating ? "wait" : "pointer", fontSize: 14, fontWeight: 600,
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? "AI is analyzing photos..." : "Generate Listing with AI"}
            </button>
          )}
        </div>

        {/* Right — Listing Details */}
        <div className="card" style={{ padding: 20 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Listing Details</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-Century Modern Walnut Dresser"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe the item — dimensions, material, brand, condition..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Price ($)</label>
                <input
                  type="number"
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }}
                >
                  <option value="">Select...</option>
                  {["Furniture", "Electronics", "Appliances", "Clothing", "Sports", "Tools", "Home Decor", "Kitchen", "Outdoor", "Toys", "Books", "Art", "Jewelry", "Collectibles", "Other"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box" }}
                >
                  <option value="">Select...</option>
                  {["New", "Like New", "Good", "Fair", "Poor"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Marketplaces */}
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, display: "block" }}>Post to Marketplaces</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {VALID_MARKETPLACES.map((mp) => (
                  <button
                    key={mp}
                    onClick={() => toggleMarketplace(mp)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: marketplaces.includes(mp) ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: marketplaces.includes(mp) ? "var(--accent-glow)" : "var(--bg-card)",
                      color: marketplaces.includes(mp) ? "var(--accent)" : "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {mp}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "var(--bg-card)",
                  color: "var(--text-secondary)", cursor: "pointer", fontSize: 14, fontWeight: 600,
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving || !title.trim() || !priceDollars}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 8,
                  border: "none", background: "var(--green)",
                  color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600,
                  opacity: saving || !title.trim() || !priceDollars ? 0.5 : 1,
                }}
              >
                Approve & Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
