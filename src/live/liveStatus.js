const listeners = new Set();

export const emitLiveStatus = (detail) => {
  const payload = {
    status: detail?.status || 'idle',
    label: detail?.label || '',
    progress: Number.isFinite(detail?.progress) ? detail.progress : null,
    task: detail?.task || 'gemini-live',
    at: Date.now(),
  };
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // ignore listener errors
    }
  });
};

export const onLiveStatus = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
