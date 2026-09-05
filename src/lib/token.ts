import { supabase } from '../config/supabase';

/**
 * Format: [FirstInitial][G][GradeTwoDigits][FourDigitSequence]
 * Example: Thenuja, Grade 10 -> TG100001
 */
export async function generateStudentAccessToken(name: string, grade: number): Promise<string> {
  const trimmed = name.trim();
  const firstInitial = (trimmed.charAt(0) || 'S').toUpperCase();
  const gradeDigits = String(grade).padStart(2, '0');
  const prefix = `${firstInitial}G${gradeDigits}`;

  try {
    // Check existing tokens in Supabase starting with this prefix
    const { data } = await supabase
      .from('students')
      .select('access_token')
      .ilike('access_token', `${prefix}%`);

    const existingSeqNumbers = new Set<number>();
    if (data && Array.isArray(data)) {
      for (const row of data) {
        if (row.access_token && row.access_token.length >= prefix.length + 4) {
          const seqPart = row.access_token.slice(prefix.length);
          const parsed = parseInt(seqPart, 10);
          if (!isNaN(parsed)) {
            existingSeqNumbers.add(parsed);
          }
        }
      }
    }

    let seq = 1;
    while (existingSeqNumbers.has(seq)) {
      seq++;
    }

    const fourDigit = String(seq).padStart(4, '0');
    return `${prefix}${fourDigit}`;
  } catch (err) {
    console.warn('[Token Engine] Supabase sequence lookup fallback:', err);
    // Fallback pseudo-random sequence to guarantee format
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomSeq}`;
  }
}

export function normalizeToken(input: string): string {
  return input.trim().toUpperCase();
}
