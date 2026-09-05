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
// TEACHERS
// -------------------------------------------------------------

export async function syncTeacherProfile(profile: TeacherProfile): Promise<TeacherProfile> {
  try {
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
      .single();

    if (error) {
      console.warn('[DB API] syncTeacherProfile notice:', error.message);
      return profile;
    }
    return data || profile;
  } catch (err) {
    console.error('[DB API] syncTeacherProfile exception:', err);
    return profile;
  }
}

// -------------------------------------------------------------
// STUDENTS (TEACHER SCOPED)
// -------------------------------------------------------------

export async function fetchStudentsByTeacher(teacherId: string): Promise<StudentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, quizzes(score, completed_at, topic), analytics(topic_mastery, streak)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DB API] fetchStudentsByTeacher notice:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => {
      // Calculate real mastery from quizzes/analytics
      let masteryRate = 50;
      let streak = 0;
      let recentTopic = 'Foundational Concepts';

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

      return {
        id: row.id,
        teacher_id: row.teacher_id,
        name: row.name,
        grade: row.grade,
        age: row.age,
        access_token: row.access_token,
        subjects: Array.isArray(row.subjects) ? row.subjects : [],
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
  const payload = {
    teacher_id: teacherId,
    name: name.trim(),
    grade,
    age,
    access_token: accessToken.toUpperCase(),
    subjects: subjects,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('students')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create student: ${error.message}`);
  }

  // Initialize analytics row for this student
  await supabase.from('analytics').insert([
    {
      student_id: data.id,
      strengths: [],
      weaknesses: [],
      topic_mastery: {},
      streak: 0,
      last_updated: new Date().toISOString(),
    },
  ]);

  return {
    ...data,
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
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('access_token', normalized)
      .maybeSingle();

    if (error) {
      console.warn('[DB API] authenticateStudentByToken notice:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      teacher_id: data.teacher_id,
      name: data.name,
      grade: data.grade,
      age: data.age,
      access_token: data.access_token,
      subjects: Array.isArray(data.subjects) ? data.subjects : [],
      created_at: data.created_at,
    };
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

    // Update student streak and topic mastery in analytics
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

    const newStreak = masteryPct >= 60 ? (currentAnalytics?.streak || 0) + 1 : 0;

    await supabase.from('analytics').upsert({
      student_id: record.student_id,
      topic_mastery: updatedMastery,
      streak: newStreak,
      last_updated: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[DB API] saveQuizResult background sync notice:', err);
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


