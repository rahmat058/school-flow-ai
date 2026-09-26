import type { School } from '@/types/school'
import { ACADEMIC_YEAR, SCHOOL_ID } from '@/data/seed'

/** The single demo tenant. */
export const activeSchool: School = {
  id: SCHOOL_ID,
  name: 'Bright Future School',
  slug: 'bright-future-school',
  address: 'House 12, Road 5, Dhanmondi, Dhaka 1205',
  contactEmail: 'office@brightfuture.edu',
  contactPhone: '+8801711000000',
  logoUrl: null,
  subscriptionStatus: 'ACTIVE',
  settings: {
    academicYear: ACADEMIC_YEAR,
    gradingScale: 'PERCENTAGE',
    termStructure: 'SEMESTER',
    // Matches `lib/grades.ts`'s fixed pass mark, so the demo's report logic and this editor agree.
    passPercentage: 40,
    currency: 'USD',
    timezone: 'Asia/Dhaka',
    gradingScheme: [
      { grade: 'A+', minPercentage: 80 },
      { grade: 'A', minPercentage: 70 },
      { grade: 'B', minPercentage: 60 },
      { grade: 'C', minPercentage: 50 },
      { grade: 'D', minPercentage: 40 },
      { grade: 'F', minPercentage: 0 },
    ],
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      attendanceAlerts: true,
      feeReminders: true,
      examNotifications: true,
    },
    security: {
      sessionTimeoutMinutes: 30,
      maxLoginAttempts: 5,
      twoFactorEnabled: false,
    },
  },
}
