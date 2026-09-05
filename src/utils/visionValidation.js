export const MAX_IMAGE_SIZE_BYTES = 7 * 1024 * 1024;
export const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, message: 'Select or capture an image first.' };
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Unsupported format. Use JPG, PNG, or WEBP only.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      message: `Image exceeds ${formatBytes(MAX_IMAGE_SIZE_BYTES)}. Please choose a smaller file.`,
    };
  }

  return { valid: true, message: '' };
};

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : '';
      if (!base64) {
        reject(new Error('Unable to encode image.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });

export const normalizeVisionResponse = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response from vision service.');
  }

  const analysis = response.analysis || {};
  const extractedText = typeof analysis.extractedText === 'string' ? analysis.extractedText : '';
  const confidence = Number.isFinite(analysis.confidence) ? analysis.confidence : 0;
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings.filter(Boolean) : [];
  const steps = Array.isArray(analysis.structuredSteps) ? analysis.structuredSteps : [];

  return {
    attemptId: response.attemptId || null,
    studentId: response.studentId || null,
    createdAt: response.createdAt || null,
    analysis: {
      extractedText,
      confidence: Math.max(0, Math.min(100, Math.round(confidence))),
      warnings,
      structuredSteps: steps.map((step, index) => ({
        title: step?.title || `Step ${index + 1}`,
        explanation: step?.explanation || '',
      })),
      summary: analysis.summary || '',
      provider: analysis.provider || 'local-fallback',
    },
  };
};
