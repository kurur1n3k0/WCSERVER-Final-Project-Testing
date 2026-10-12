import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import './style.css';
import App from './App.vue';
import HomeView from './views/HomeView.vue';
import DiscoverView from './views/DiscoverView.vue';
import AboutView from './views/AboutView.vue';
import ContactView from './views/ContactView.vue';
import ProfileView from './views/ProfileView.vue';
import AdminView from './views/AdminView.vue';
import { account, authReady, initializeAccount } from './state.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/discover', component: DiscoverView },
    { path: '/about', component: AboutView },
    { path: '/contact', component: ContactView },
    { path: '/profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0, behavior: 'smooth' };
  }
});

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.requiresAdmin) return true;
  if (!authReady.value) await initializeAccount();
  if (!account.user) {
    account.authMode = 'login';
    account.showAuth = true;
    return { path: '/', query: { next: to.fullPath } };
  }
  if (to.meta.requiresAdmin && account.user.role !== 'admin') return '/profile';
  return true;
});

createApp(App).use(router).mount('#app');
