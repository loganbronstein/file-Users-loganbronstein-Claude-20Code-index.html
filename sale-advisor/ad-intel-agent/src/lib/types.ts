export type Audience =
  | "college"
  | "young_professionals"
  | "parents"
  | "seniors"
  | "everyone";

export type Platform = "meta" | "google" | "tiktok" | "nextdoor";

export type CampaignGoal = "awareness" | "lead_gen" | "retargeting";

export type Tone = "casual" | "professional" | "urgent" | "emotional";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  college: "College Students (18-22)",
  young_professionals: "Young Professionals (23-35)",
  parents: "Parents/Families (30-50)",
  seniors: "Seniors/Retirees (55+)",
  everyone: "Everyone (General)",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  meta: "Facebook / Instagram (Meta)",
  google: "Google Ads",
  tiktok: "TikTok",
  nextdoor: "Nextdoor",
};

export const GOAL_LABELS: Record<CampaignGoal, string> = {
  awareness: "Brand Awareness",
  lead_gen: "Lead Generation",
  retargeting: "Retargeting",
};

export const TONE_LABELS: Record<Tone, string> = {
  casual: "Casual / Funny",
  professional: "Professional / Trustworthy",
  urgent: "Urgent / FOMO",
  emotional: "Emotional / Storytelling",
};

export interface GenerateRequest {
  audience: Audience;
  platform: Platform;
  goal: CampaignGoal;
  tone: Tone;
  itemFocus: string;
  variations: number;
}

export interface AdCreativeVariation {
  variationNumber: number;
  hook: string;
  bodyCopy: string;
  cta: string;
  visualDirection: string;
  hashtags: string[];
  platformSpecs: string;
}

export interface GenerateResponse {
  variations: AdCreativeVariation[];
  platform: Platform;
  audience: Audience;
  goal: CampaignGoal;
  tone: Tone;
  itemFocus: string;
}

export interface SavedCreative extends GenerateResponse {
  id: string;
  createdAt: string;
  starred: boolean;
}
