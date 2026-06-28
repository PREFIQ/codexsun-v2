export type SubscriptionStatus = "active" | "expired" | "suspended" | "trial";

export type SubscriptionPlan = {
  code: string;
  limits: Record<string, number>;
  name: string;
};

export type TenantSubscription = {
  planCode: string;
  status: SubscriptionStatus;
  tenantId: string;
  validUntil?: string;
};
