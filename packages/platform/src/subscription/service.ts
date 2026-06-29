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

export class SubscriptionService {
  async requireSubscriptionAllowed(_tenantId: string, _moduleKey: string): Promise<void> {
    // Placeholder: subscription check not yet implemented.
    // Future implementation should check the tenant's subscription plan
    // and verify the module is included or available as an add-on.
  }
}
