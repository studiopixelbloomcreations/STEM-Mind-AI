import { supabase } from '../../config/supabase';
import {
  CurriculumSubject,
  getDefaultGrade9Subjects,
  getDefaultGrade10or11Subjects,
} from '../curriculum';
import { generateStudentAccessToken } from '../token';

export interface TeacherProfile {
  id: string; // Firebase UID
  email: string;
  name?: string;
  photo_url?: string;
  created_at?: string;
}

export interface StudentRecord {
  id: string;
  teacher_id: string;
  name: string;
  grade: number;
  age: number;
  access_token: string;
  subjects: CurriculumSubject[];
  created_at?: string;
  // Computed/joined fields for analytics
  mastery_rate?: number;
  streak?: number;
  recent_topic?: string;
  preferred_subjects?: string[];
}

export interface QuizRecord {
  id?: string;
  student_id: string;
  subject: string;
  topic: string;
  difficulty: string;
  questions?: any[];
  score: number;
  total_questions: number;
  time_spent?: number;
  completed_at?: string;
}

export interface StudentAnalytics {
  student_id: string;
  strengths: string[];
  weaknesses: string[];
  topic_mastery: Record<string, number>;
  streak: number;
  last_updated?: string;
}

// -------------------------------------------------------------
// HELPER FUNCTIONS FOR SCHEMA RESILIENCE
// -------------------------------------------------------------

function resolveToken(row: any): string {
  if (row.access_token) return row.access_token.trim().toUpperCase();
  if (Array.isArray(row.subjects)) {
    const tokenItem = row.subjects.find((s: any) => typeof s === 'string' && s.startsWith('TOKEN:'));
    if (tokenItem) return tokenItem.replace('TOKEN:', '').trim().toUpperCase();
  }
  // Deterministic fallback from student name & grade
  const initial = (row.name?.trim()?.charAt(0) || 'S').toUpperCase();
  const g = String(row.grade || 10).padStart(2, '0');
  const shortId = row.id ? String(row.id).replace(/[^0-9]/g, '').slice(0, 4) : '1001';
  return `${initial}G${g}${shortId.padStart(4, '0')}`;
}

function resolveSubjects(rowSubjects: any): CurriculumSubject[] {
  if (!rowSubjects || !Array.isArray(rowSubjects)) return [];
  return rowSubjects
    .filter((s: any) => {
      if (typeof s === 'string') return !s.startsWith('TOKEN:');
      return true;
    })
    .map((s: any) => {
      if (typeof s === 'string') {
        return { name: s, category: 'compulsory' as const };
      }
      return s;
    });
}

// -------------------------------------------------------------
// TEACHERS
// -------------------------------------------------------------

export async function syncTeacherProfile(profile: TeacherProfile): Promise<TeacherProfile> {
  try {
    // Try upserting full profile (with name, photo_url)
    const { data, error } = await supabase
      .from('teachers')
      .upsert({
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        photo_url: profile.photo_url || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      // Fallback: if 'name' or 'photo_url' column is missing in schema, upsert only id and email
      const { data: fallbackData } = await supabase
        .from('teachers')
        .upsert({
          id: profile.id,
          email: profile.email,
        })
        .select()
        .maybeSingle();

      return fallbackData || profile;
    }
    return data || profile;
  } catch (err) {
    return profile;
  }
}

// -------------------------------------------------------------
// STUDENTS (TEACHER SCOPED)
// -------------------------------------------------------------

export async function fetchStudentsByTeacher(teacherId: string): Promise<StudentRecord[]> {
  try {
    // 1. Try relational query without assuming 'streak' column exists in analytics
    let { data, error } = await supabase
      .from('students')
      .select('*, quizzes(score, completed_at, topic), analytics(topic_mastery)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    // 2. If relational join fails, fallback to simple select on students
    if (error || !data) {
      const fallback = await supabase
        .from('students')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (fallback.error || !fallback.data) {
        return [];
      }
      data = fallback.data;
    }

    return data.map((row: any) => {
      let masteryRate = 65;
      let streak = 0;
      let recentTopic = 'Core Syllabus Foundations';

      if (row.analytics && row.analytics.length > 0) {
        const an = row.analytics[0];
        streak = an.streak || 0;
        const tm = an.topic_mastery || {};
        const values = Object.values(tm) as number[];
        if (values.length > 0) {
          masteryRate = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        }
      }

      if (row.quizzes && row.quizzes.length > 0) {
        const sorted = [...row.quizzes].sort(
          (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        );
        recentTopic = sorted[0].topic || recentTopic;
      }

      const subjects = resolveSubjects(row.subjects);
      const token = resolveToken(row);

      return {
        id: row.id,
        teacher_id: row.teacher_id,
        name: row.name,
        grade: row.grade,
        age: row.age,
        access_token: token,
        subjects,
        preferred_subjects: subjects.map((s) => s.name),
        created_at: row.created_at,
        mastery_rate: masteryRate,
        streak,
        recent_topic: recentTopic,
      };
    });
  } catch (err) {
    console.error('[DB API] fetchStudentsByTeacher exception:', err);
    return [];
  }
}

export async function registerNewStudent(
  teacherId: string,
  name: string,
  grade: number,
  age: number,
  accessToken: string,
  subjects: CurriculumSubject[]
): Promise<StudentRecord> {
  const normToken = accessToken.trim().toUpperCase();
  const subjectNames = subjects.map((s) => (typeof s === 'string' ? s : s.name));

  let createdRow: any = null;

  // 1. First attempt: try with access_token column
  try {
    const payload = {
      teacher_id: teacherId,
      name: name.trim(),
      grade,
      age,
      access_token: normToken,
      subjects: subjectNames,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('students')
      .insert([payload])
      .select()
      .maybeSingle();

    if (!error && data) {
      createdRow = data;
    }
  } catch (e) {
    // continue to fallback
  }

  // 2. Fallback: if 'access_token' column does not exist, store token inside subjects TEXT[]
  if (!createdRow) {
    const fallbackPayload = {
      teacher_id: teacherId,
      name: name.trim(),
      grade,
      age,
      subjects: [...subjectNames, `TOKEN:${normToken}`],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('students')
      .insert([fallbackPayload])
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to create student: ${error.message}`);
    }
    createdRow = data;
  }

  // Initialize analytics safely (without assuming streak column exists)
  try {
    await supabase.from('analytics').insert([
      {
        student_id: createdRow.id,
        strengths: [],
        weaknesses: [],
        topic_mastery: {},
        last_updated: new Date().toISOString(),
      },
    ]);
  } catch (e) {
    // Non-critical, continue
  }

  return {
    id: createdRow.id,
    teacher_id: createdRow.teacher_id,
    name: createdRow.name,
    grade: createdRow.grade,
    age: createdRow.age,
    access_token: normToken,
    subjects,
    preferred_subjects: subjectNames,
    created_at: createdRow.created_at,
    mastery_rate: 50,
    streak: 0,
    recent_topic: 'Starting Set',
  };
}

// -------------------------------------------------------------
// STUDENT LOGIN VIA ACCESS TOKEN
// -------------------------------------------------------------

export async function authenticateStudentByToken(token: string): Promise<StudentRecord | null> {
  const normalized = token.trim().toUpperCase();
  if (!normalized) return null;

  try {
    // 1. Direct query on access_token column if it exists
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('access_token', normalized)
      .maybeSingle();

    if (!error && data) {
      const subjects = resolveSubjects(data.subjects);
      return {
        id: data.id,
        teacher_id: data.teacher_id,
        name: data.name,
        grade: data.grade,
        age: data.age,
        access_token: normalized,
        subjects,
        preferred_subjects: subjects.map((s) => s.name),
        created_at: data.created_at,
      };
    }

    // 2. Fallback: fetch recent students and match against resolveToken or TOKEN: in subjects
    const { data: allStudents, error: allErr } = await supabase
      .from('students')
      .select('*')
      .limit(300);

    if (!allErr && allStudents && Array.isArray(allStudents)) {
      const match = allStudents.find((row) => {
        const studentToken = resolveToken(row);
        return studentToken === normalized;
      });

      if (match) {
        const subjects = resolveSubjects(match.subjects);
        return {
          id: match.id,
          teacher_id: match.teacher_id,
          name: match.name,
          grade: match.grade,
          age: match.age,
          access_token: normalized,
          subjects,
          preferred_subjects: subjects.map((s) => s.name),
          created_at: match.created_at,
        };
      }
    }

    return null;
  } catch (err) {
    console.error('[DB API] authenticateStudentByToken exception:', err);
    return null;
  }
}

// -------------------------------------------------------------
// QUIZZES & ANALYTICS
// -------------------------------------------------------------

export async function saveQuizResult(record: QuizRecord): Promise<void> {
  try {
    await supabase.from('quizzes').insert([
      {
        student_id: record.student_id,
        subject: record.subject,
        topic: record.topic,
        difficulty: record.difficulty,
        score: record.score,
        questions: record.questions || [],
        time_spent: record.time_spent || 0,
        completed_at: new Date().toISOString(),
      },
    ]);

    // Fetch existing analytics
    const { data: currentAnalytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('student_id', record.student_id)
      .maybeSingle();

    const masteryPct = Math.round((record.score / record.total_questions) * 100);
    const existingMastery = currentAnalytics?.topic_mastery || {};
    const updatedMastery = {
      ...existingMastery,
      [record.topic]: masteryPct,
    };

    // Upsert safely
    await supabase.from('analytics').upsert({
      student_id: record.student_id,
      topic_mastery: updatedMastery,
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[DB API] saveQuizResult sync notice:', err);
  }
}

export type StudentProfile = StudentRecord;

export async function fetchTeacherStudents(teacherId?: string): Promise<StudentProfile[]> {
  const id = teacherId || 'default-teacher';
  return fetchStudentsByTeacher(id);
}

export async function createStudent(
  name: string,
  grade: number,
  teacherId?: string
): Promise<StudentProfile> {
  const token = await generateStudentAccessToken(name, grade);
  const subjects = grade === 9 ? getDefaultGrade9Subjects() : getDefaultGrade10or11Subjects();
  return registerNewStudent(teacherId || 'default-teacher', name, grade, 15, token, subjects);
}
