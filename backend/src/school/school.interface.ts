import type { SubscriptionStatus } from '../common/enums/subscription-status.enum.js';

/** A row in the schools list — the profile columns, without the settings document. */
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

/** One school — the row plus the `settings` document the Settings tabs edit. */
export interface SchoolDetail extends SchoolRow {
  settings: Record<string, unknown>;
}

/** A manual backup job — the demo returns `READY` at once, a real deployment enqueues it. */
export interface BackupJob {
  id: string;
  createdAt: string;
  sizeBytes: number;
  status: 'PENDING' | 'READY' | 'FAILED';
}
