"use client";

import { useState } from "react";
import {
  AUDIENCE_LABELS,
  PLATFORM_LABELS,
  GOAL_LABELS,
  TONE_LABELS,
  type Audience,
  type Platform,
  type CampaignGoal,
  type Tone,
  type GenerateResponse,
  type AdCreativeVariation,
} from "@/lib/types";
import { saveCreative } from "@/lib/storage";

const LOADING_MESSAGES = [
  "Crafting scroll-stopping hooks...",
  "Writing copy that converts...",
  "Generating visual directions...",
  "Optimizing for your audience...",
  "Building creative variations...",
];

export default function GeneratorPage() {
  const [audience, setAudience] = useState<Audience>("everyone");
  const [platform, setPlatform] = useState<Platform>("meta");
  const [goal, setGoal] = useState<CampaignGoal>("lead_gen");
  const [tone, setTone] = useState<Tone>("casual");
  const [itemFocus, setItemFocus] = useState("");
  const [variations, setVariations] = useState(3);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [results, setResults] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResults(null);
    setSaved(false);

    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2000);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          platform,
          goal,
          tone,
          itemFocus,
          variations,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  function handleSave() {
    if (results) {
      saveCreative(results);
      setSaved(true);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  function formatVariation(v: AdCreativeVariation): string {
    return `HOOK: ${v.hook}\n\nCOPY: ${v.bodyCopy}\n\nCTA: ${v.cta}\n\nVISUAL: ${v.visualDirection}\n\nHASHTAGS: ${v.hashtags.join(" ")}\n\nSPECS: ${v.platformSpecs}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Ad Creative Generator</h1>
      <p className="text-[var(--text-secondary)] mb-6">
        Generate high-converting ad creatives for Sale Advisor campaigns
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <SelectField
          label="Target Audience"
          value={audience}
          onChange={(v) => setAudience(v as Audience)}
          options={AUDIENCE_LABELS}
        />
        <SelectField
          label="Platform"
          value={platform}
          onChange={(v) => setPlatform(v as Platform)}
          options={PLATFORM_LABELS}
        />
        <SelectField
          label="Campaign Goal"
          value={goal}
          onChange={(v) => setGoal(v as CampaignGoal)}
          options={GOAL_LABELS}
        />
        <SelectField
          label="Tone"
          value={tone}
          onChange={(v) => setTone(v as Tone)}
          options={TONE_LABELS}
        />

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">
            Item Focus (optional)
          </label>
          <input
            type="text"
            value={itemFocus}
            onChange={(e) => setItemFocus(e.target.value)}
            placeholder='e.g., "furniture", "estate sale"'
            className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">
            Variations ({variations})
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={variations}
            onChange={(e) => setVariations(Number(e.target.value))}
            className="w-full accent-[var(--gold)]"
          />
          <div className="flex justify-between text-xs text-[var(--text-secondary)]">
            <span>1</span>
            <span>5</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-[var(--gold)] text-[var(--navy)] font-semibold px-6 py-2.5 rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating..." : "Generate Creatives"}
        </button>

        {results && !saved && (
          <button
            onClick={handleSave}
            className="border border-[var(--green)] text-[var(--green)] font-medium px-4 py-2.5 rounded-lg hover:bg-[var(--green)] hover:text-white transition"
          >
            Save to Library
          </button>
        )}
        {saved && (
          <span className="text-[var(--green)] self-center text-sm font-medium">
            Saved to library
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-[var(--gold)] mb-6">
          <div className="w-5 h-5 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">{loadingMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">
            {results.variations.length} Variation
            {results.variations.length > 1 ? "s" : ""} Generated
          </h2>
          {results.variations.map((v, i) => (
            <div
              key={i}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[var(--gold)] font-semibold">
                  Variation {v.variationNumber}
                </h3>
                <button
                  onClick={() => copyText(formatVariation(v), `all-${i}`)}
                  className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded transition"
                >
                  {copiedIdx === `all-${i}` ? "Copied!" : "Copy All"}
                </button>
              </div>

              <CreativeField
                label="Hook"
                value={v.hook}
                copyKey={`hook-${i}`}
                copiedIdx={copiedIdx}
                onCopy={copyText}
              />
              <CreativeField
                label="Body Copy"
                value={v.bodyCopy}
                copyKey={`body-${i}`}
                copiedIdx={copiedIdx}
                onCopy={copyText}
              />
              <CreativeField
                label="CTA"
                value={v.cta}
                copyKey={`cta-${i}`}
                copiedIdx={copiedIdx}
                onCopy={copyText}
              />
              <CreativeField
                label="Visual Direction"
                value={v.visualDirection}
                copyKey={`visual-${i}`}
                copiedIdx={copiedIdx}
                onCopy={copyText}
              />
              <div className="mb-3">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Hashtags
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {v.hashtags.map((h, hi) => (
                    <span
                      key={hi}
                      className="bg-[var(--navy)] text-[var(--gold)] text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-[var(--gold)] hover:text-[var(--navy)] transition"
                      onClick={() => copyText(h, `tag-${i}-${hi}`)}
                    >
                      {copiedIdx === `tag-${i}-${hi}` ? "Copied!" : h}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-[var(--text-secondary)] bg-[var(--dark-bg)] rounded p-3 mt-2">
                {v.platformSpecs}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Record<string, string>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]"
      >
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

function CreativeField({
  label,
  value,
  copyKey,
  copiedIdx,
  onCopy,
}: {
  label: string;
  value: string;
  copyKey: string;
  copiedIdx: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </span>
        <button
          onClick={() => onCopy(value, copyKey)}
          className="text-xs text-[var(--text-secondary)] hover:text-white transition"
        >
          {copiedIdx === copyKey ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  );
}
