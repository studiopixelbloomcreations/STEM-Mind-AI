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
    // Select existing students to identify occupied sequence numbers
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(100);

    const existingSeqNumbers = new Set<number>();
    if (!error && data && Array.isArray(data)) {
      for (const row of data) {
        let token: string | undefined = row.access_token;
        if (!token && Array.isArray(row.subjects)) {
          const t = row.subjects.find((s: any) => typeof s === 'string' && s.startsWith('TOKEN:'));
          if (t) token = t.replace('TOKEN:', '').trim();
        }

        if (token && token.startsWith(prefix) && token.length >= prefix.length + 4) {
          const seqPart = token.slice(prefix.length);
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
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${randomSeq}`;
  }
}

export function normalizeToken(input: string): string {
  return input.trim().toUpperCase();
}
