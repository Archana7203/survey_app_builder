import { buildApiUrl, API_BASES} from './apiConfig';

export const AUTH_API_BASE = API_BASES.AUTH;

export const AUTH_API = {
  ME: () => buildApiUrl(`${AUTH_API_BASE}/me`),
  LOGIN: () => buildApiUrl(`${AUTH_API_BASE}/login`),
  REGISTER: () => buildApiUrl(`${AUTH_API_BASE}/register`),
  LOGOUT: () => buildApiUrl(`${AUTH_API_BASE}/logout`),
};
