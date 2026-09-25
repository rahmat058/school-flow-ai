import type { AiConversation } from '@/types/ai'
import { SCHOOL_ID, dateTimeOffset } from '@/data/seed'

/**
 * History per user per feature — the assistant screen's sample output. Each row is a two-turn
 * conversation (the filled prompt, then the reply), and `promptArgs` keeps the tool form's own
 * fields so a past generation could be reopened with its inputs once the AI is wired up.
 */
export const aiConversations: AiConversation[] = [
  {
    id: 'aic_1',
    schoolId: SCHOOL_ID,
    userId: 'usr_admin_1',
    feature: 'EVENT_PLAN',
    title: 'Independence Day — full event plan',
    promptArgs: {
      name: 'Independence Day',
      type: 'Republic / Independence Day',
      date: '2027-01-26',
      participants: '100',
      budget: '50000',
    },
    messages: [
      { role: 'user', content: 'Plan the Independence Day event for 100 participants on a $50,000 budget.' },
      {
        role: 'assistant',
        content: `EVENT PLAN — Independence Day

## 1. Objectives
| # | Objective | Why it matters |
| --- | --- | --- |
| 1 | **Celebrate the national day** with a theme of "Unity in Diversity". | Boosts confidence and creative expression. |
| 2 | **Encourage community participation** — involve parents, local officials and alumni. | Strengthens school-community ties. |
| 3 | **Promote civic awareness** through quizzes, speeches and a short exhibition on the Constitution & Freedom Struggle. | Enhances knowledge of rights and duties. |
| 4 | **Conduct a safe, well-organised event** within the allotted budget. | Sets a standard for future functions. |

## 2. Full-Day Timeline (Hour-by-Hour)
| Time | Activity | Details / Lead |
| --- | --- | --- |
| **08:00 – 08:30** | **Arrival & Registration** | Gate staff check-in, issue name-cards & programme booklet. |
| **08:30 – 09:00** | **Morning Assembly — Flag Hoisting** | Principal hoists the flag; the school choir sings the anthem. |
| **09:00 – 09:45** | **Cultural Programme** | Group songs, folk dance and a short play by each house. |
| **09:45 – 10:30** | **Quiz & Exhibition** | Constitution quiz; students present freedom-struggle exhibits. |
| **10:30 – 11:00** | **Refreshments** | Snacks and water at the canteen; volunteers on duty. |
| **11:00 – 12:00** | **Speeches & Prize Giving** | Chief guest address, certificates for the quiz winners. |
| **12:00 – 12:30** | **Vote of Thanks & Dispersal** | Class teachers hand students back to guardians. |

## 3. Budget
| Item | Allocation |
| --- | --- |
| Stage, sound & lighting | $18,000 |
| Refreshments | $12,000 |
| Costumes & props | $8,000 |
| Printing & certificates | $5,000 |
| Contingency (14%) | $7,000 |
| **Total** | **$50,000** |

## 4. Checklist
- Two weeks out: confirm the chief guest, book the sound system, publish the notice.
- One week out: house rehearsals, print booklets, brief the volunteers.
- Day before: stage setup, sound check, seating plan.
- On the day: gates open 07:30, medical post staffed, photographs for the yearbook.`,
      },
    ],
    createdAt: dateTimeOffset(-4, 10, 20),
    updatedAt: dateTimeOffset(-4, 10, 26),
  },
  {
    id: 'aic_2',
    schoolId: SCHOOL_ID,
    userId: 'usr_admin_1',
    feature: 'QUIZ',
    title: 'Electric Charge — 5-question quiz',
    promptArgs: { subject: 'Science', topic: 'Electric Charge', questions: '5' },
    messages: [
      { role: 'user', content: 'Write 5 multiple-choice questions on Electric Charge for class 9.' },
      {
        role: 'assistant',
        content: `Q1. Which statement best describes the conservation of electric charge?
A) Electric charge can be created or destroyed in chemical reactions.
B) The total electric charge of an isolated system remains constant.
C) Positive and negative charges always cancel completely.
D) Charge is conserved only in conductors, not in insulators.

Q2. Two identical small spheres are rubbed with different materials. Sphere A acquires +5 μC and sphere B −3 μC. What is the net electrostatic force between them at 0.10 m? (k = 9×10⁹ N·m²/C²)
A) 1.35 N attractive
B) 2.25 N repulsive
C) 13.5 N repulsive
D) 22.5 N attractive

Q3. The charge on one electron is closest to which value?
A) 1.6 × 10⁻¹⁹ C
B) 9.1 × 10⁻³¹ C
C) 6.6 × 10⁻³⁴ C
D) 3.2 × 10⁻¹⁹ C

Q4. A body has a net charge of −4.8 μC. How many excess electrons does it carry?
A) 3.0 × 10¹³
B) 3.0 × 10¹⁹
C) 4.8 × 10¹³
D) 7.6 × 10¹²

Q5. Which method of charging does **not** require contact between two bodies?
A) Conduction
B) Friction
C) Induction
D) Polarisation by rubbing`,
      },
    ],
    createdAt: dateTimeOffset(-2, 14, 5),
    updatedAt: dateTimeOffset(-2, 14, 9),
  },
  {
    id: 'aic_3',
    schoolId: SCHOOL_ID,
    userId: 'usr_tch_1',
    feature: 'QUIZ',
    title: 'Fractions — 5-question quiz',
    promptArgs: { subject: 'Mathematics', topic: 'Fractions', questions: '5' },
    messages: [
      { role: 'user', content: 'Write 5 multiple-choice questions on Fractions for class 5.' },
      {
        role: 'assistant',
        content: `Q1. Which fraction is equivalent to 3/4?
A) 6/8  B) 4/3  C) 5/8  D) 3/8

Q2. What is 1/2 + 1/4?
A) 2/6  B) 3/4  C) 2/4  D) 1/6

Q3. Which of these is the smallest?
A) 1/3  B) 1/5  C) 1/2  D) 1/8

Q4. Convert 7/2 to a mixed number.
A) 2 1/2  B) 3 1/2  C) 3 1/7  D) 2 3/7

Q5. A pizza is cut into 8 equal slices and 3 are eaten. What fraction is left?
A) 3/8  B) 5/8  C) 1/3  D) 8/5`,
      },
    ],
    createdAt: dateTimeOffset(-1, 9, 15),
    updatedAt: dateTimeOffset(-1, 9, 22),
  },
  {
    id: 'aic_4',
    schoolId: SCHOOL_ID,
    userId: 'usr_std_1',
    feature: 'HOMEWORK_HELP',
    title: 'Equivalent fractions, step by step',
    promptArgs: { subject: 'Mathematics', question: 'Why is 3/4 the same as 6/8?' },
    messages: [
      { role: 'user', content: 'Explain why 3/4 and 6/8 are the same.' },
      {
        role: 'assistant',
        content: `Let's take it step by step.

**1. Start with the picture.** Cut a cake into 4 equal slices and take 3. You have 3/4 of the cake.

**2. Cut each slice in half.** Now the same cake has 8 slices, and your 3 slices became 6. You still hold the same amount of cake — 6/8.

**3. The rule.** Multiplying the top and the bottom by the same number (here 2) never changes the value:
3/4 = (3 × 2)/(4 × 2) = 6/8

**4. Check the other way.** Divide 6 and 8 by 2 and you are back at 3/4. That is what "simplest form" means.

**Try it yourself:** what is 3/4 as twelfths? (Multiply both by 3 → 9/12.)`,
      },
    ],
    createdAt: dateTimeOffset(-1, 20, 5),
    updatedAt: dateTimeOffset(-1, 20, 9),
  },
  {
    id: 'aic_5',
    schoolId: SCHOOL_ID,
    userId: 'usr_admin_1',
    feature: 'HOMEWORK_HELP',
    title: 'Long division, step by step',
    promptArgs: { subject: 'Mathematics', question: 'How do I divide 456 by 6 using long division?' },
    messages: [
      { role: 'user', content: 'Explain long division for 456 ÷ 6.' },
      {
        role: 'assistant',
        content: `Long division, one digit at a time.

**1.** 6 into 4? It does not go, so take the first two digits: 6 into 45 goes **7** times (6 × 7 = 42).
Write 7 above the 5, subtract 42 from 45 → remainder **3**.

**2.** Bring down the 6 to make **36**. 6 into 36 goes **6** times exactly (6 × 6 = 36), remainder **0**.

**3.** No digits left. The answer is **76**.

**Check:** 76 × 6 = 456 ✔`,
      },
    ],
    createdAt: dateTimeOffset(-1, 21, 10),
    updatedAt: dateTimeOffset(-1, 21, 13),
  },
  {
    id: 'aic_6',
    schoolId: SCHOOL_ID,
    userId: 'usr_admin_1',
    feature: 'NOTICE',
    title: 'Half-yearly examination notice',
    promptArgs: {
      type: 'exam',
      details: 'Half-yearly exams begin 10 September; the datesheet is on the notice board.',
    },
    messages: [
      { role: 'user', content: 'Draft a notice about the half-yearly examinations.' },
      {
        role: 'assistant',
        content: `**NOTICE — Half-Yearly Examinations**

Dear students and guardians,

The half-yearly examinations for all classes begin on **10 September** and run to **19 September**. The full datesheet has been published on the school notice board and in the parent portal.

- Reporting time is **08:30**; the first paper starts at **09:00**.
- Students must bring their admit card and their own stationery.
- Admit cards can be collected from the class teacher until **7 September**.

Guardians are requested to ensure that students reach school on time and to clear any outstanding dues before the examinations begin.

*Principal's Office*
Bright Future School`,
      },
    ],
    createdAt: dateTimeOffset(-3, 12, 0),
    updatedAt: dateTimeOffset(-3, 12, 4),
  },
  {
    id: 'aic_7',
    schoolId: SCHOOL_ID,
    userId: 'usr_admin_1',
    feature: 'CHAT',
    title: 'How is this term tracking?',
    promptArgs: { question: 'How is this term tracking?' },
    messages: [
      { role: 'user', content: 'How is this term tracking?' },
      {
        role: 'assistant',
        content: `Here is where the school stands on the three signals the dashboard tracks.

## 1. Attendance
| Signal | Reading | What it means |
| --- | --- | --- |
| **Register rate** | holding in the high 80s | the present-and-late share across every class's register |
| **Weakest classes** | those with no register day this month | a class is only as current as its last mark, so an untaken register reads low |

## 2. Fee collection
- **Collected** is running ahead of the same point last term.
- The **defaulter list** is led by invoices past their due date — chase those rows first.

## 3. Results
- Published report cards put the **class averages** within a normal spread.
- A paper only counts once its exam is published, so an unpublished test is in no average yet.

**Next step:** open *Fees → Reports → Defaulters* and work the list top-down; it is sorted by how far past due each balance is.`,
      },
    ],
    createdAt: dateTimeOffset(-1, 11, 5),
    updatedAt: dateTimeOffset(-1, 11, 12),
  },
]
