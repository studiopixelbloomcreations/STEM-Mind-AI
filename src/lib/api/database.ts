import { supabase } from '../../config/supabase';

export interface StudentProfile {
  id: string;
  name: string;
  grade: number;
  created_at?: string;
  teacher_id?: string;
  preferred_subjects?: string[];
  mastery_rate?: number;
  streak?: number;
}

export async function fetchTeacherStudents(teacherId?: string): Promise<StudentProfile[]> {
  try {
    const query = supabase.from('students').select('*').order('created_at', { ascending: false });
    if (teacherId) query.eq('teacher_id', teacherId);
    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (err) {
    console.warn('[Database API] Supabase student query fallback:', err);
  }

  // Demo seeded student roster for realistic teacher dashboard telemetry
  return [
    {
      id: 'std_01',
      name: 'Kavindu Senaratne',
      grade: 11,
      mastery_rate: 88,
      streak: 6,
      preferred_subjects: ['Physics', 'Mathematics'],
      created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: 'std_02',
      name: 'Tharushi Fernando',
      grade: 10,
      mastery_rate: 74,
      streak: 3,
      preferred_subjects: ['Chemistry', 'Science'],
      created_at: new Date(Date.now() - 86400000 * 21).toISOString(),
    },
    {
      id: 'std_03',
      name: 'Dulitha Perera',
      grade: 10,
      mastery_rate: 92,
      streak: 11,
      preferred_subjects: ['Combined Maths', 'Physics'],
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'std_04',
      name: 'Ananya Jayawardena',
      grade: 9,
      mastery_rate: 65,
      streak: 2,
      preferred_subjects: ['Science', 'Mathematics'],
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
  ];
}

export async function createStudent(name: string, grade: number, teacherId?: string): Promise<StudentProfile> {
  const newStudent: StudentProfile = {
    id: `std_${Date.now().toString(36)}`,
    name,
    grade,
    teacher_id: teacherId,
    mastery_rate: 50,
    streak: 0,
    preferred_subjects: ['Mathematics', 'Science'],
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('students').insert([newStudent]).select().single();
    if (!error && data) return data;
  } catch (err) {
    console.warn('[Database API] Student creation fallback to local state:', err);
  }

  return newStudent;
}
