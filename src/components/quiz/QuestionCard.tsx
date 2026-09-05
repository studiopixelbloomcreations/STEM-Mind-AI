import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AnswerInput } from './AnswerInput';
import { StuckButton } from './StuckButton';
import { FeedbackBanner } from './FeedbackBanner';
import { QuizQuestionPayload, TeachingStep, explainWrongAnswer } from '../../lib/api/harmony';

export interface QuestionCardProps {
  question: QuizQuestionPayload;
  questionIndex: number;
  totalQuestions: number;
  onAnswerSubmit: (isCorrect: boolean) => void;
  onNextQuestion: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  onAnswerSubmit,
  onNextQuestion,
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [submissionState, setSubmissionState] = useState<'unanswered' | 'correct' | 'incorrect' | 'teaching'>('unanswered');
  const [teachingSteps, setTeachingSteps] = useState<TeachingStep[]>([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    const trimmedUser = userAnswer.trim().toLowerCase();
    const trimmedTarget = question.correctAnswer.trim().toLowerCase();

    // Numerical evaluation with tolerance
    let correct = false;
    if (question.questionType === 'NUMERICAL') {
      const numUser = parseFloat(trimmedUser);
      const numTarget = parseFloat(trimmedTarget);
      if (!isNaN(numUser) && !isNaN(numTarget)) {
        const diff = Math.abs(numUser - numTarget);
        correct = diff <= Math.abs(numTarget) * 0.02 || diff < 0.01;
      } else {
        correct = trimmedUser === trimmedTarget;
      }
    } else {
      correct = trimmedUser === trimmedTarget;
    }

    if (correct) {
      setSubmissionState('correct');
      onAnswerSubmit(true);
    } else {
      setSubmissionState('incorrect');
      onAnswerSubmit(false);
      // Fetch step-by-step repair
      setIsLoadingSteps(true);
      try {
        const steps = await explainWrongAnswer(question.question, question.correctAnswer, userAnswer);
        setTeachingSteps(steps);
      } finally {
        setIsLoadingSteps(false);
      }
    }
  };

  const handleStuck = async () => {
    setSubmissionState('teaching');
    setIsLoadingSteps(true);
    try {
      const steps = await explainWrongAnswer(question.question, question.correctAnswer, 'Uncertain');
      setTeachingSteps(steps);
    } finally {
      setIsLoadingSteps(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-8 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-sm">
      {/* Header telemetry */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--color-accent)] font-bold">
            QUESTION {questionIndex + 1} / {totalQuestions}
          </span>
          <Badge variant="default">{question.syllabusRef || 'Syllabus Standard'}</Badge>
        </div>
        <Badge variant={question.difficulty === 'hard' ? 'warning' : 'default'}>
          {question.difficulty || 'Medium'}
        </Badge>
      </div>

      {/* Main Question Text */}
      <h3 className="text-xl lg:text-2xl font-display font-bold text-[var(--color-text-primary)] mb-8 leading-snug">
        {question.question}
      </h3>

      {/* Answer Form Input Section */}
      <div className="mb-8">
        <AnswerInput
          questionType={question.questionType}
          choices={question.choices}
          value={userAnswer}
          onChange={setUserAnswer}
          disabled={submissionState !== 'unanswered'}
          status={submissionState === 'correct' ? 'correct' : submissionState === 'incorrect' ? 'incorrect' : 'idle'}
        />
      </div>

      {/* Primary Action + "I'm Stuck" Button Row */}
      {submissionState === 'unanswered' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--color-border)]">
          <StuckButton onClick={handleStuck} disabled={isLoadingSteps} />

          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || isLoadingSteps}
            className="w-full sm:w-auto px-6"
          >
            Submit Answer
          </Button>
        </div>
      )}

      {/* Feedback & Teaching Transition State */}
      {submissionState !== 'unanswered' && (
        <FeedbackBanner
          status={submissionState}
          correctAnswer={question.correctAnswer}
          explanationSteps={teachingSteps}
          examTips={question.examTips}
          onContinue={onNextQuestion}
        />
      )}
    </Card>
  );
};
