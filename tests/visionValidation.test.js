import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_IMAGE_SIZE_BYTES,
  formatBytes,
  normalizeVisionResponse,
  validateImageFile,
} from '../src/utils/visionValidation.js';

test('validateImageFile rejects unsupported mime', () => {
  const result = validateImageFile({ type: 'application/pdf', size: 2000 });
  assert.equal(result.valid, false);
  assert.match(result.message, /Unsupported format/);
});

test('validateImageFile rejects oversized files', () => {
  const result = validateImageFile({ type: 'image/png', size: MAX_IMAGE_SIZE_BYTES + 100 });
  assert.equal(result.valid, false);
  assert.match(result.message, /Image exceeds/);
});

test('normalizeVisionResponse safely normalizes analysis payload', () => {
  const normalized = normalizeVisionResponse({
    attemptId: 'a1',
    analysis: {
      extractedText: 'hello',
      confidence: 98.2,
      warnings: ['warn'],
      structuredSteps: [{ title: 'Step A', explanation: 'Do X' }],
      summary: 'summary',
      provider: 'test-provider',
    },
  });
  assert.equal(normalized.attemptId, 'a1');
  assert.equal(normalized.analysis.confidence, 98);
  assert.equal(normalized.analysis.structuredSteps[0].title, 'Step A');
});

test('formatBytes gives readable output', () => {
  assert.equal(formatBytes(1024), '1.0 KB');
});
