export type FeatureFlags = {
  enableAnalytics: boolean;
  enableAI: boolean;
};

export const flags: FeatureFlags = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  enableAI: process.env.NEXT_PUBLIC_ENABLE_AI !== "false",
};


