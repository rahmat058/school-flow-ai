export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

/** A minimum-percentage band; `schools.settings.gradingScheme` is JSONB on the backend. */
export interface GradeBand {
  grade: string
  minPercentage: number
}

export interface SchoolSettings {
  academicYear: string
  currency: 'USD'
  timezone: string
  gradingScheme: GradeBand[]
}

export interface School {
  id: string
  name: string
  slug: string
  address: string | null
  contactEmail: string | null
  contactPhone: string | null
  logoUrl: string | null
  subscriptionStatus: SubscriptionStatus
  settings: SchoolSettings
}
