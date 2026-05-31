import React, { useEffect, useState } from 'react';
import { onModelLoadProgress } from '../ml/transformersClient';

const friendlyTask = (task) => {
  if (!task) return 'model';
  if (task.includes('speech')) return 'voice';
  if (task.includes('image-to-text')) return 'vision';
  if (task.includes('object-detection')) return 'detection';
  if (task.includes('automatic-speech')) return 'speech recognition';
  return task;
};

export default function ModelLoadProgress({ label = 'Loading AI models' }) {
  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let hideTimer = 0;
    const unsubscribe = onModelLoadProgress((progress) => {
      if (progress.status === 'done' || progress.progress === 100) {
        setDetail(progress);
        hideTimer = window.setTimeout(() => setVisible(false), 1200);
        return;
      }
      setVisible(true);
      setDetail(progress);
      if (hideTimer) window.clearTimeout(hideTimer);
    });
    return () => {
      unsubscribe();
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  const pct =
    detail?.progress != null && Number.isFinite(detail.progress)
      ? Math.round(detail.progress)
      : detail?.loaded && detail?.total
        ? Math.round((detail.loaded / detail.total) * 100)
        : null;

  return (
    <div className="model-load-progress" role="status" aria-live="polite">
      <div className="model-load-progress__bar">
        <div
          className="model-load-progress__fill"
          style={{ width: pct != null ? `${Math.min(100, pct)}%` : '35%' }}
        />
      </div>
      <p className="model-load-progress__text">
        {label}: {friendlyTask(detail?.task)}
        {pct != null ? ` (${pct}%)` : '…'}
      </p>
    </div>
  );
}
