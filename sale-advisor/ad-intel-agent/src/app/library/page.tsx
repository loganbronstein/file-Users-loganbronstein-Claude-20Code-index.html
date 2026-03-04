"use client";

import { useState, useEffect } from "react";
import {
  type SavedCreative,
  type Platform,
  type Audience,
  PLATFORM_LABELS,
  AUDIENCE_LABELS,
  GOAL_LABELS,
  TONE_LABELS,
} from "@/lib/types";
import { getCreatives, toggleStar, deleteCreative } from "@/lib/storage";

export default function LibraryPage() {
  const [creatives, setCreatives] = useState<SavedCreative[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterAudience, setFilterAudience] = useState<Audience | "all">("all");
  const [filterStarred, setFilterStarred] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setCreatives(getCreatives());
  }, []);

  function refresh() {
    setCreatives(getCreatives());
  }

  function handleToggleStar(id: string) {
    toggleStar(id);
    refresh();
  }

  function handleDelete(id: string) {
    deleteCreative(id);
    refresh();
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  const filtered = creatives.filter((c) => {
    if (filterPlatform !== "all" && c.platform !== filterPlatform) return false;
    if (filterAudience !== "all" && c.audience !== filterAudience) return false;
    if (filterStarred && !c.starred) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Creative Library</h1>
      <p className="text-[var(--text-secondary)] mb-6">
        All your saved ad creatives in one place
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterPlatform}
          onChange={(e) =>
            setFilterPlatform(e.target.value as Platform | "all")
          }
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">All Platforms</option>
          {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={filterAudience}
          onChange={(e) =>
            setFilterAudience(e.target.value as Audience | "all")
          }
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">All Audiences</option>
          {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <button
          onClick={() => setFilterStarred(!filterStarred)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition ${
            filterStarred
              ? "bg-[var(--gold)] text-[var(--navy)] border-[var(--gold)]"
              : "border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--gold)]"
          }`}
        >
          {filterStarred ? "★ Starred" : "☆ Starred"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          {creatives.length === 0 ? (
            <>
              <p className="text-lg mb-2">No creatives saved yet</p>
              <p className="text-sm">
                Generate some on the{" "}
                <a href="/" className="text-[var(--gold)] hover:underline">
                  Generate
                </a>{" "}
                page and save them here
              </p>
            </>
          ) : (
            <p>No creatives match your filters</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((creative) => (
            <div
              key={creative.id}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition"
                onClick={() =>
                  setExpandedId(
                    expandedId === creative.id ? null : creative.id
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(creative.id);
                    }}
                    className="text-lg hover:scale-110 transition"
                  >
                    {creative.starred ? "★" : "☆"}
                  </button>
                  <div>
                    <div className="flex gap-2 mb-1">
                      <span className="text-xs bg-[var(--navy)] text-[var(--gold)] px-2 py-0.5 rounded">
                        {PLATFORM_LABELS[creative.platform]}
                      </span>
                      <span className="text-xs bg-[var(--navy)] text-[var(--green)] px-2 py-0.5 rounded">
                        {AUDIENCE_LABELS[creative.audience]}
                      </span>
                      <span className="text-xs bg-[var(--navy)] text-[var(--text-secondary)] px-2 py-0.5 rounded">
                        {GOAL_LABELS[creative.goal]}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(creative.createdAt).toLocaleDateString()} ·{" "}
                      {creative.variations.length} variation
                      {creative.variations.length > 1 ? "s" : ""} ·{" "}
                      {TONE_LABELS[creative.tone]}
                      {creative.itemFocus && ` · ${creative.itemFocus}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(creative.id);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition"
                  >
                    Delete
                  </button>
                  <span className="text-[var(--text-secondary)] text-sm">
                    {expandedId === creative.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {expandedId === creative.id && (
                <div className="border-t border-[var(--card-border)] p-4 space-y-4">
                  {creative.variations.map((v, i) => (
                    <div
                      key={i}
                      className="bg-[var(--dark-bg)] rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[var(--gold)] font-medium text-sm">
                          Variation {v.variationNumber}
                        </h4>
                        <button
                          onClick={() =>
                            copyText(
                              `HOOK: ${v.hook}\n\nCOPY: ${v.bodyCopy}\n\nCTA: ${v.cta}\n\nVISUAL: ${v.visualDirection}\n\nHASHTAGS: ${v.hashtags.join(" ")}`,
                              `lib-${creative.id}-${i}`
                            )
                          }
                          className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded transition"
                        >
                          {copiedIdx === `lib-${creative.id}-${i}`
                            ? "Copied!"
                            : "Copy All"}
                        </button>
                      </div>
                      <Field label="Hook" value={v.hook} />
                      <Field label="Body Copy" value={v.bodyCopy} />
                      <Field label="CTA" value={v.cta} />
                      <Field label="Visual Direction" value={v.visualDirection} />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {v.hashtags.map((h, hi) => (
                          <span
                            key={hi}
                            className="bg-[var(--card-bg)] text-[var(--gold)] text-xs px-2 py-0.5 rounded cursor-pointer hover:brightness-125"
                            onClick={() =>
                              copyText(h, `libtag-${creative.id}-${i}-${hi}`)
                            }
                          >
                            {copiedIdx === `libtag-${creative.id}-${i}-${hi}`
                              ? "Copied!"
                              : h}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-medium">
        {label}
      </span>
      <p className="text-sm mt-0.5 leading-relaxed">{value}</p>
    </div>
  );
}
