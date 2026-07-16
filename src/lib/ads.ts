// Ad creatives. Populated by real campaigns via the admin ad manager / external
// ad networks. Empty by default so no invented advertisers ever show on the site.
export interface Creative {
  id: string;
  advertiser: string;
  title: string;
  subtitle: string;
  cta: string;
  color: string;
  kind: "banner" | "native";
}

export const creatives: Creative[] = [];

// External ad-network integrations. Empty until a network is actually connected.
export const adIntegrations: { id: string; name: string; status: string; note: string }[] = [];
