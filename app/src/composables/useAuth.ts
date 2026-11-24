import { computed, ref } from 'vue';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Device } from '@capacitor/device';
import { api } from '@/services/api';

export interface Usuario { id: number; nombre: string }

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

// Estado compartido por toda la app (fuera de la función = un solo valor) — YA IMPLEMENTADO
const token = ref<string | null>(null);
const usuario = ref<Usuario | null>(null);
let tokenCargado = false;

/** YA IMPLEMENTADO — lo usa services/api.ts para armar el encabezado Authorization. */
export const obtenerToken = () => token.value;

/**
 * TODO [M2] Borrar token y usuario de la memoria (refs) y del almacenamiento cifrado.
 */
export async function olvidarSesion() {
  token.value = null;
  usuario.value = null;
  await Promise.allSettled([
    SecureStorage.remove(CLAVE_TOKEN),
    SecureStorage.remove(CLAVE_USUARIO),
  ]);
}

export function useAuth() {
  const estaAutenticado = computed(() => token.value !== null);

  /**
   * TODO [M2] login(email, password)
   */
  async function login(email: string, password: string) {
    const info = await Device.getInfo();
    const device_name = `${info.platform} ${info.model}`.slice(0, 60);

    const respuesta = await api<{ token: string; usuario: Usuario }>('/login', {
      method: 'POST',
      body: { email, password, device_name },
    });

    token.value = respuesta.token;
    usuario.value = respuesta.usuario;

    await SecureStorage.set(CLAVE_TOKEN, respuesta.token);
    await SecureStorage.set(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
  }

  /**
   * TODO [M2] cargarToken()
   */
  async function cargarToken() {
    if (tokenCargado) return;
    tokenCargado = true;

    try {
      const [tokenGuardado, usuarioGuardado] = await Promise.all([
        SecureStorage.get(CLAVE_TOKEN),
        SecureStorage.get(CLAVE_USUARIO),
      ]);

      if (typeof tokenGuardado === 'string' && tokenGuardado) {
        token.value = tokenGuardado;
      }

      if (typeof usuarioGuardado === 'string' && usuarioGuardado) {
        usuario.value = JSON.parse(usuarioGuardado) as Usuario;
      }
    } catch {
      await olvidarSesion();
    }
  }

  /**
   * TODO [M2] cerrarSesion()
   */
  async function cerrarSesion() {
    try {
      await api('/logout', { method: 'POST' });
    } catch {
      // Se ignora cualquier error de red o token vencido para asegurar el cierre local
    } finally {
      await olvidarSesion();
    }
  }

  return { usuario, estaAutenticado, login, cargarToken, cerrarSesion };
}