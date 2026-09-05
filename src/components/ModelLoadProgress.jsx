import React, { useEffect, useState } from 'react';
import { onLiveStatus } from '../live/liveStatus';

export default function ModelLoadProgress({ label = 'Connecting Gemini Live' }) {
  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let hideTimer = 0;
    const unsubscribe = onLiveStatus((progress) => {
      if (progress.status === 'done' || progress.progress === 100) {
        setDetail(progress);
        hideTimer = window.setTimeout(() => setVisible(false), 900);
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

  const pct = detail?.progress != null && Number.isFinite(detail.progress)
    ? Math.round(detail.progress)
    : null;

  return (
    <div className="model-load-progress" role="status" aria-live="polite">
      <div className="model-load-progress__bar">
        <div
          className="model-load-progress__fill"
          style={{ width: pct != null ? `${Math.min(100, pct)}%` : '40%' }}
        />
      </div>
      <p className="model-load-progress__text">
        {detail?.label || label}
        {pct != null ? ` (${pct}%)` : '…'}
      </p>
    </div>
  );
}
