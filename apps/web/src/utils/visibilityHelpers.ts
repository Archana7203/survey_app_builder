export const evaluateCondition = (
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'count_eq'
    | 'count_gt'
    | 'count_lt'
    | 'has_selected',
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

  const equalsMatch = (a: any, b: any): boolean => normalizeString(a) === normalizeString(b);
  
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
      const match = equalsMatch(responseValue, condValue);
      return match;
    }
    case 'not_equals': {
      if (Array.isArray(responseValue)) {
        const normalizedResponse = responseValue.map(normalizeString);
        const normalizedCond = normalizeString(condValue);
        return !normalizedResponse.includes(normalizedCond);
      }
      const respNum = coerceNumeric(responseValue);
      const condNum = coerceNumeric(condValue);
      if (!Number.isNaN(respNum) && !Number.isNaN(condNum)) {
        return respNum !== condNum;
      }
      return !equalsMatch(responseValue, condValue);
    }
    
    case 'contains': {
      if (Array.isArray(responseValue)) {
        return responseValue.some(v => equalsMatch(v, condValue));
      }
      return normalizeString(responseValue).includes(normalizeString(condValue));
    }
    case 'not_contains': {
      if (Array.isArray(responseValue)) {
        return !responseValue.some(v => equalsMatch(v, condValue));
      }
      return !normalizeString(responseValue).includes(normalizeString(condValue));
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
    case 'has_selected': {
      if (Array.isArray(responseValue)) {
        return responseValue.map(normalizeString).includes(normalizeString(condValue));
      }
      return equalsMatch(responseValue, condValue);
    }
    case 'count_eq': {
      const count = Array.isArray(responseValue) ? responseValue.length : 0;
      const condNum = coerceNumeric(condValue);
      return !Number.isNaN(condNum) && count === condNum;
    }
    case 'count_gt': {
      const count = Array.isArray(responseValue) ? responseValue.length : 0;
      const condNum = coerceNumeric(condValue);
      return !Number.isNaN(condNum) && count > condNum;
    }
    case 'count_lt': {
      const count = Array.isArray(responseValue) ? responseValue.length : 0;
      const condNum = coerceNumeric(condValue);
      return !Number.isNaN(condNum) && count < condNum;
    }
    
    default:
      return false;
  }
};