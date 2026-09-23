import type { School } from '@/types/school'
import { ACADEMIC_YEAR, SCHOOL_ID } from '@/data/seed'

/** The single demo tenant. */
export const activeSchool: School = {
  id: SCHOOL_ID,
  name: 'Bright Future School',
  slug: 'bright-future-school',
  address: 'House 12, Road 5, Dhanmondi, Dhaka 1205',
  contactEmail: 'office@brightfuture.edu',
  contactPhone: '+880 1711 000000',
  logoUrl: null,
  subscriptionStatus: 'ACTIVE',
  settings: {
    academicYear: ACADEMIC_YEAR,
    currency: 'INR',
    timezone: 'Asia/Dhaka',
    gradingScheme: [
      { grade: 'A+', minPercentage: 80 },
      { grade: 'A', minPercentage: 70 },
      { grade: 'B', minPercentage: 60 },
      { grade: 'C', minPercentage: 50 },
      { grade: 'D', minPercentage: 40 },
      { grade: 'F', minPercentage: 0 },
    ],
  },
}
