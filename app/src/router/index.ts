import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TabsPage from '@/views/TabsPage.vue';
import { useAuth } from '@/composables/useAuth';

// YA IMPLEMENTADO — rutas. Equipos y Perfil son pestañas con pilas independientes.
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tabs/equipos' },
  { path: '/login', component: () => import('@/views/LoginPage.vue'), meta: { soloInvitados: true } },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiereSesion: true },
    children: [
      { path: '', redirect: '/tabs/equipos' },
      { path: 'equipos', component: () => import('@/views/EquiposPage.vue') },
      { path: 'equipos/nuevo', component: () => import('@/views/EquipoFormPage.vue') },
      { path: 'equipos/:id/editar', component: () => import('@/views/EquipoFormPage.vue'), props: true },
      { path: 'perfil', component: () => import('@/views/PerfilPage.vue') },
    ],
  },
];

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes });

/**
 * TODO [M3] Guarda de navegación (4 pts).
 */
router.beforeEach(async (to) => {
  const { estaAutenticado, cargarToken } = useAuth();

  // 1. Restaurar la sesión guardada en SecureStorage (solo se lee una vez gracias a tokenCargado)
  await cargarToken();

  // 2. Verificar si la ruta o alguno de sus padres (ej. /tabs/) requiere sesión
  const requiereSesion = to.matched.some((ruta) => ruta.meta.requiereSesion);
  if (requiereSesion && !estaAutenticado.value) {
    return '/login';
  }

  // 3. Evitar que usuarios ya autenticados entren a rutas solo para invitados (/login)
  const soloInvitados = to.matched.some((ruta) => ruta.meta.soloInvitados);
  if (soloInvitados && estaAutenticado.value) {
    return '/tabs/equipos';
  }
});

export default router;