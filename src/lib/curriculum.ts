export interface CurriculumSubject {
  name: string;
  category: 'compulsory' | 'basket1' | 'basket2' | 'basket3' | 'aesthetic';
  basket?: number;
  options?: string[];
  selectedOption?: string;
}

export const RELIGION_OPTIONS = [
  'Buddhism',
  'Catholicism',
  'Christianity',
  'Islam',
  'Saivaneri (Hinduism)',
];

export const GRADE_9_AESTHETIC_OPTIONS = [
  'Art',
  'Western Music',
  'Eastern (Oriental) Music',
  'Carnatic Music',
  'Oriental Dancing',
  'Bharatha Dancing',
  'English Literature',
];

export const BASKET_1_OPTIONS = [
  'Business & Accounting Studies',
  'Geography',
  'Civic Education',
  'Entrepreneurship Studies',
  'Second Language (Sinhala)',
  'Second Language (Tamil)',
  'Pali',
  'Sanskrit',
  'French',
  'German',
];

export const BASKET_2_OPTIONS = [
  'Art',
  'Drama & Theatre',
  'Oriental (Eastern) Music',
  'Western Music',
  'Carnatic Music',
  'Oriental Dancing',
  'Bharatha Dancing',
  'Sinhala Literature',
  'Tamil Literature',
  'English Literature',
];

export const BASKET_3_OPTIONS = [
  'Information & Communication Technology',
  'Agriculture & Food Technology',
  'Aquatic Bio-Resources Technology',
  'Arts & Crafts',
  'Home Economics',
  'Health & Physical Education',
  'Communication & Media Studies',
  'Design & Construction Technology',
  'Design & Mechanical Technology',
  'Design, Electrical & Electronic Technology',
];

export function getDefaultGrade9Subjects(
  religion: string = 'Buddhism',
  firstLang: 'Sinhala' | 'Tamil' = 'Sinhala',
  aesthetic: string = 'Art'
): CurriculumSubject[] {
  const secondLang = firstLang === 'Sinhala' ? 'Tamil' : 'Sinhala';

  return [
    { name: `Religion (${religion})`, category: 'compulsory', selectedOption: religion },
    { name: `First Language (${firstLang})`, category: 'compulsory', selectedOption: firstLang },
    { name: `Second Language (${secondLang})`, category: 'compulsory', selectedOption: secondLang },
    { name: 'English', category: 'compulsory' },
    { name: 'Mathematics', category: 'compulsory' },
    { name: 'Science', category: 'compulsory' },
    { name: 'History', category: 'compulsory' },
    { name: 'Civics', category: 'compulsory' },
    { name: 'Geography', category: 'compulsory' },
    { name: 'Health & Physical Education', category: 'compulsory' },
    { name: 'Practical & Technical Skills (PTS)', category: 'compulsory' },
    { name: 'Information & Communication Technology (ICT)', category: 'compulsory' },
    { name: `Aesthetic (${aesthetic})`, category: 'aesthetic', selectedOption: aesthetic },
  ];
}

export function getDefaultGrade10or11Subjects(
  religion: string = 'Buddhism',
  firstLang: 'Sinhala' | 'Tamil' = 'Sinhala',
  basket1: string = 'Business & Accounting Studies',
  basket2: string = 'Art',
  basket3: string = 'Information & Communication Technology'
): CurriculumSubject[] {
  return [
    { name: `Religion (${religion})`, category: 'compulsory', selectedOption: religion },
    { name: `First Language (${firstLang})`, category: 'compulsory', selectedOption: firstLang },
    { name: 'English', category: 'compulsory' },
    { name: 'Mathematics', category: 'compulsory' },
    { name: 'Science', category: 'compulsory' },
    { name: 'History', category: 'compulsory' },
    { name: basket1, category: 'basket1', basket: 1, selectedOption: basket1 },
    { name: basket2, category: 'basket2', basket: 2, selectedOption: basket2 },
    { name: basket3, category: 'basket3', basket: 3, selectedOption: basket3 },
  ];
}
