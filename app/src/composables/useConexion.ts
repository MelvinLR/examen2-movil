import { onMounted, onUnmounted, ref } from 'vue';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * TODO [M7] Capacidades nativas (6 pts en total: este archivo, PerfilPage.vue y AndroidManifest.xml).
 */
export function useConexion() {
  const conectado = ref(true);
  const tipo = ref<string>('unknown');
  let handle: PluginListenerHandle | null = null;

  onMounted(async () => {
    const estadoInicial = await Network.getStatus();
    conectado.value = estadoInicial.connected;
    tipo.value = estadoInicial.connectionType;

    handle = await Network.addListener('networkStatusChange', (estado) => {
      conectado.value = estado.connected;
      tipo.value = estado.connectionType;
    });
  });

  onUnmounted(async () => {
    await handle?.remove();
    handle = null;
  });

  return { conectado, tipo };
}

/**
 * TODO [M7] vibrar(): vibración breve de confirmación con Haptics.impact({ style: ImpactStyle.Light })
 */
export async function vibrar() {
  if (!Capacitor.isNativePlatform()) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}