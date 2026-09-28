import type { SubscriptionStatus } from '../common/enums/subscription-status.enum.js';

export interface SchoolRow {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}
