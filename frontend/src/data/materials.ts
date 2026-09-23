import type { StudyMaterial } from '@/types/homework'
import { SCHOOL_ID, dateTimeOffset } from '@/data/seed'

interface MaterialSpec {
  classIndex: number
  subjectIndex: number
  title: string
  description: string
  type: StudyMaterial['type']
}

const SPECS: MaterialSpec[] = [
  {
    classIndex: 1,
    subjectIndex: 2,
    title: 'Fractions — revision notes',
    description: 'Worked examples for equivalent fractions and mixed numbers.',
    type: 'NOTES',
  },
  {
    classIndex: 1,
    subjectIndex: 1,
    title: 'Reading list — term 2',
    description: 'Six graded readers matched to the class reading level.',
    type: 'PDF',
  },
  {
    classIndex: 2,
    subjectIndex: 3,
    title: 'Plant and animal cells — worksheet',
    description: 'Labelling and comparison exercise.',
    type: 'WORKSHEET',
  },
  {
    classIndex: 3,
    subjectIndex: 2,
    title: 'Algebra practice paper',
    description: 'Previous mid term paper with marking scheme.',
    type: 'PAPER',
  },
  {
    classIndex: 3,
    subjectIndex: 3,
    title: 'Acids, bases and salts',
    description: 'Chapter notes plus the practical method sheet.',
    type: 'NOTES',
  },
  {
    classIndex: 4,
    subjectIndex: 1,
    title: 'Grammar drill — tenses',
    description: 'Fifty sentences covering the four past tenses.',
    type: 'WORKSHEET',
  },
  {
    classIndex: 5,
    subjectIndex: 5,
    title: 'Spreadsheet formulas cheat sheet',
    description: 'One-page summary of SUM, AVERAGE, IF and COUNTIF.',
    type: 'PDF',
  },
  {
    classIndex: 6,
    subjectIndex: 4,
    title: 'Final exam paper — social studies',
    description: 'Last year\u2019s final paper for practice.',
    type: 'PAPER',
  },
]

export const studyMaterials: StudyMaterial[] = SPECS.map((spec, index) => ({
  id: `mat_${index + 1}`,
  schoolId: SCHOOL_ID,
  classId: `cls_${spec.classIndex}`,
  subjectId: `sub_${spec.classIndex}_${spec.subjectIndex}`,
  uploadedById: index % 3 === 0 ? 'usr_admin_1' : `usr_tch_${(index % 8) + 1}`,
  title: spec.title,
  description: spec.description,
  type: spec.type,
  fileUrl: `https://res.cloudinary.com/school-flow/materials/${spec.type.toLowerCase()}-${index + 1}.pdf`,
  fileSizeBytes: 180_000 + index * 42_500,
  createdAt: dateTimeOffset(-(2 + index * 3), 10, 30),
}))
