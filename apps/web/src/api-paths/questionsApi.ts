import { buildApiUrl, API_BASES} from './apiConfig';

export const QUESTIONS_API_BASE = API_BASES.QUESTIONS;

export const QUESTIONS_API = {
  TYPES: () => buildApiUrl(`${QUESTIONS_API_BASE}/types`),
};