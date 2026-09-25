import type { MaterialType, StudyMaterial } from '@/types/materials'
import { SCHOOL_ID, dateTimeOffset } from '@/data/seed'
import { subjectForClassCode } from '@/data/subjects'

interface MaterialSpec {
  classIndex: number
  /** The subject the material belongs to, by its catalogue code. */
  subjectCode: string
  title: string
  description: string
  type: MaterialType
}

const SPECS: MaterialSpec[] = [
  {
    classIndex: 1,
    subjectCode: 'MATH',
    title: 'Fractions — revision notes',
    description: 'Worked examples for equivalent fractions and mixed numbers.',
    type: 'NOTES',
  },
  {
    classIndex: 1,
    subjectCode: 'ENG',
    title: 'Reading list — term 2',
    description: 'Six graded readers matched to the class reading level.',
    type: 'PDF',
  },
  {
    classIndex: 2,
    subjectCode: 'SCI',
    title: 'Plant and animal cells — worksheet',
    description: 'Labelling and comparison exercise.',
    type: 'WORKSHEET',
  },
  {
    classIndex: 3,
    subjectCode: 'MATH',
    title: 'Algebra practice paper',
    description: 'Previous mid term paper with marking scheme.',
    type: 'PAPER',
  },
  {
    classIndex: 3,
    subjectCode: 'SCI',
    title: 'Acids, bases and salts',
    description: 'Chapter notes plus the practical method sheet.',
    type: 'NOTES',
  },
  {
    classIndex: 4,
    subjectCode: 'ENG',
    title: 'Grammar drill — tenses',
    description: 'Fifty sentences covering the four past tenses.',
    type: 'WORKSHEET',
  },
  {
    classIndex: 5,
    subjectCode: 'CS',
    title: 'Spreadsheet formulas cheat sheet',
    description: 'One-page summary of SUM, AVERAGE, IF and COUNTIF.',
    type: 'PDF',
  },
  {
    classIndex: 6,
    subjectCode: 'SST',
    title: 'Final exam paper — social science',
    description: 'Last year’s final paper for practice.',
    type: 'PAPER',
  },
]

export const studyMaterials: StudyMaterial[] = SPECS.map((spec, index) => {
  const createdAt = dateTimeOffset(-(2 + index * 3), 10, 30)

  return {
    id: `mat_${index + 1}`,
    schoolId: SCHOOL_ID,
    classId: `cls_${spec.classIndex}`,
    subjectId: subjectForClassCode(`cls_${spec.classIndex}`, spec.subjectCode)?.id ?? '',
    uploadedById: index % 3 === 0 ? 'usr_admin_1' : `usr_tch_${(index % 8) + 1}`,
    title: spec.title,
    description: spec.description,
    type: spec.type,
    fileUrl: `https://res.cloudinary.com/school-flow/materials/${spec.type.toLowerCase()}-${index + 1}.pdf`,
    fileSizeBytes: 180_000 + index * 42_500,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  }
})
