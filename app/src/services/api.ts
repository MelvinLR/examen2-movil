import { ErrorApi } from './errores';
import { obtenerToken, olvidarSesion } from '@/composables/useAuth';
import router from '@/router';

const BASE_URL = import.meta.env.VITE_API_URL;
const TIEMPO_MAXIMO_MS = 10_000;

export interface OpcionesApi {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

export async function api<T = unknown>(ruta: string, opciones: OpcionesApi = {}): Promise<T> {
  const { method = 'GET', body, params } = opciones;

  // 1. Construir URL y agregar query params válidos (ni undefined ni '')
  let url = `${BASE_URL}${ruta}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== '') {
        searchParams.append(clave, String(valor));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // 2, 3 y 4. Configurar cabeceras y cuerpo JSON
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const token = obtenerToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // 5. Controlador de tiempo máximo (10s)
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controlador.signal,
    });
  } catch {
    throw new ErrorApi(0, { mensaje: 'No fue posible conectar con la API.' });
  } finally {
    clearTimeout(temporizador);
  }

  // 6. Respuesta 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  // Parsear el cuerpo JSON (con respaldo seguro por si viene vacío en algún error)
  const cuerpoJson = await response.json().catch(() => null);

  // 7. Manejo de errores HTTP
  if (!response.ok) {
    if (response.status === 401 && ruta !== '/login') {
      await olvidarSesion();
      router.replace('/login');
    }
    throw new ErrorApi(response.status, cuerpoJson);
  }

  // 8. Respuesta exitosa
  return cuerpoJson as T;
}