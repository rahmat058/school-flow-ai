export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

/** A minimum-percentage band; `schools.settings.gradingScheme` is JSONB on the backend. */
export interface GradeBand {
  grade: string
  minPercentage: number
}

/** How a mark is reported — the Academic tab's "Grading Scale". */
export type GradingScale = 'PERCENTAGE' | 'LETTER' | 'GPA'

/** How the academic year is split — the Academic tab's "Term Structure". */
export type TermStructure = 'SEMESTER' | 'TRIMESTER' | 'ANNUAL'

/** The Notifications tab's school-wide toggles. */
export interface NotificationSettings {
  emailAlerts: boolean
  smsAlerts: boolean
  attendanceAlerts: boolean
  feeReminders: boolean
  examNotifications: boolean
}

/** The Security tab's fields. */
export interface SecuritySettings {
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  twoFactorEnabled: boolean
}

export interface SchoolSettings {
  academicYear: string
  gradingScale: GradingScale
  termStructure: TermStructure
  passPercentage: number
  currency: 'USD'
  timezone: string
  gradingScheme: GradeBand[]
  notifications: NotificationSettings
  security: SecuritySettings
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

/** The School Profile tab writes the school's own columns, not `settings`. */
export interface SchoolProfileInput {
  name: string
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  logoUrl?: string | null
}

/**
 * A partial patch merged into `schools.settings`. Each settings tab sends only its own slice, so an
 * absent group is left alone and the tabs cannot overwrite one another.
 */
export interface SchoolSettingsInput {
  academicYear?: string
  gradingScale?: GradingScale
  termStructure?: TermStructure
  passPercentage?: number
  notifications?: Partial<NotificationSettings>
  security?: Partial<SecuritySettings>
}

/** The Security tab's manual backup job. */
export interface BackupJob {
  id: string
  createdAt: string
  sizeBytes: number
  status: 'PENDING' | 'READY' | 'FAILED'
}
