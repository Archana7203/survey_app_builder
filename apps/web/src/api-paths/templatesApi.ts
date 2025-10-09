import { buildApiUrl, API_BASES} from './apiConfig';

export const TEMPLATES_API_BASE = API_BASES.TEMPLATES;

export const TEMPLATES_API = {
  ENSURE_SAMPLES: () => buildApiUrl(`${TEMPLATES_API_BASE}/ensure-samples`),
};