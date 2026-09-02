/* useDesignTokens — Hook that provides the design token system as runtime values.
 * Consumes the designTokens export from src/tokens/designTokens.ts
 * and makes them available as JavaScript values for component styling.
 */

import React, { useEffect, useState } from 'react';
import { designTokens } from '../tokens/designTokens';

const useDesignTokens = () => {
  const [tokens, setTokens] = useState<object>({});

  useEffect(() => {
    // Apply all tokens from the designTokens export
    const applyTokens = (tokens: object) => {
      const doc = document.documentElement;
      const style = doc.style;
      
      // Apply each token as a CSS custom property
      Object.entries(tokens).forEach(([key, value]) => {
        // Skip internal/non-CSS properties
        if (typeof value === 'number') {
          // For z-index values, set as regular CSS property
          style.setProperty(`--${key}`, String(value));
        } else {
          style.setProperty(`--${key}`, value);
        }
      });
    };

    applyTokens(designTokens);
    
    // Re-apply when designTokens changes (should not happen in practice)
    return () => {
      // No cleanup needed for this simple case
    };
  }, [designTokens]);

  return tokens;
};

export default useDesignTokens;