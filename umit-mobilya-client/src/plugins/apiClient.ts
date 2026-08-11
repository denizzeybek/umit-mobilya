import { OpenAPI } from '@/client';
import { EStorageKeys } from '@/enums/storageKeys.enum';

/*
 * The generated paths already start with `/api` (they come straight from the
 * server's route decorators), while VITE_API_URL ends with `/api` because the
 * hand-written axios layer needed it there. Stripping the suffix keeps one
 * environment variable serving both, so Netlify does not need a second one.
 */
const apiUrl = import.meta.env.VITE_API_URL ?? '';

OpenAPI.BASE = apiUrl.replace(/\/api\/?$/, '');
OpenAPI.WITH_CREDENTIALS = true;

/*
 * Resolved per request rather than captured once: the token is written to
 * localStorage after login, long after this module is first evaluated.
 */
OpenAPI.TOKEN = async () =>
  localStorage.getItem(EStorageKeys.TOKEN) ?? '';
