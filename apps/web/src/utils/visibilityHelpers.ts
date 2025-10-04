export const evaluateCondition = (
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than',
  condValue: any,
  responseValue: any
): boolean => {
 
  const smileyOrder: Record<string, number> = {
    very_sad: 1,
    sad: 2,
    neutral: 3,
    happy: 4,
    very_happy: 5,
  };
  
  const coerceNumeric = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && smileyOrder[val] !== undefined) return smileyOrder[val];
    const n = Number(val);
    return Number.isNaN(n) ? Number.NaN : n;
  };
  
  // Normalize strings for comparison (trim and lowercase)
  const normalizeString = (val: any): string => {
    return String(val).trim().toLowerCase();
  };
  
  switch (operator) {
    case 'equals': {
      // Handle arrays (multi-select)
      if (Array.isArray(responseValue)) {
        const normalizedResponse = responseValue.map(normalizeString);
        const normalizedCond = normalizeString(condValue);
        const match = normalizedResponse.includes(normalizedCond);
        return match;
      }
      
      // Try numeric comparison first (for ratings)
      const respNum = coerceNumeric(responseValue);
      const condNum = coerceNumeric(condValue);
      if (!Number.isNaN(respNum) && !Number.isNaN(condNum)) {
        const match = respNum === condNum;
        return match;
      }
      
      // String comparison (case-insensitive, trimmed)
      const match = normalizeString(responseValue) === normalizeString(condValue);
      return match;
    }
    
    case 'contains': {
      if (Array.isArray(responseValue)) {
        const match = responseValue.some(v => 
          normalizeString(v).includes(normalizeString(condValue))
        );
        return match;
      }
      const match = normalizeString(responseValue).includes(normalizeString(condValue));
      return match;
    }
    
    case 'greater_than': {
      const respNum = coerceNumeric(responseValue);
      const condNum = coerceNumeric(condValue);
      const match = !Number.isNaN(respNum) && !Number.isNaN(condNum) && respNum > condNum;
      return match;
    }
    
    case 'less_than': {
      const respNum = coerceNumeric(responseValue);
      const condNum = coerceNumeric(condValue);
      const match = !Number.isNaN(respNum) && !Number.isNaN(condNum) && respNum < condNum;
      return match;
    }
    
    default:
      return false;
  }
};