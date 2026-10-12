<template>
  <div class="app-container">
    <nav class="navbar">
      <RouterLink class="brand" to="/" aria-label="Angeles Discovery home">
        <span class="brand-mark" aria-hidden="true">A</span>
        <span>Angeles<span class="brand-light">Discovery</span></span>
      </RouterLink>
      <button class="mobile-menu-toggle" type="button" :aria-expanded="mobileNavOpen" aria-label="Toggle navigation" @click="mobileNavOpen = !mobileNavOpen">
        <span>{{ mobileNavOpen ? '×' : '☰' }}</span>
      </button>
      <div class="nav-links" :class="{ 'nav-links-open': mobileNavOpen }">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/discover">Discover</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/contact">Contact</RouterLink>
        <button
          v-if="account.user"
          class="saved-nav"
          type="button"
          @click="goToSaved"
        >
          <span aria-hidden="true">♡</span>
          Saved
          <span v-if="account.favoriteIds.length" class="saved-count">{{ account.favoriteIds.length }}</span>
        </button>
        <RouterLink v-if="account.user" to="/profile" class="profile-nav">Profile</RouterLink>
        <RouterLink v-if="account.user?.role === 'admin'" to="/admin" class="profile-nav">Admin</RouterLink>
        <button
          v-if="account.user"
          class="account-nav"
          type="button"
          @click="signOut"
        >{{ account.user.name.split(' ')[0] }} · Sign out</button>
        <button v-else class="account-nav" type="button" @click="openAuth('login')">
          Sign in
        </button>
      </div>
    </nav>

    <RouterView />

    <footer v-if="route.path !== '/'" class="site-footer">
      <RouterLink class="brand footer-brand" to="/">
        <span class="brand-mark" aria-hidden="true">A</span>
        <span>Angeles<span class="brand-light">Discovery</span></span>
      </RouterLink>
      <p>A little guide to a city with a lot to love.</p>
      <nav aria-label="Footer navigation">
        <RouterLink to="/discover">Discover</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/contact">Contact</RouterLink>
      </nav>
      <span class="footer-location">MADE FOR YOUR NEXT PAMPANGA DAY OUT <span>✳</span></span>
    </footer>

    <Transition name="toast-slide">
      <div v-if="ui.toast" class="app-toast" :class="`app-toast--${ui.toastType}`" role="status" aria-live="polite">
        <span class="toast-mark" aria-hidden="true">{{ ui.toastType === 'error' ? '!' : '✓' }}</span>
        <span>{{ ui.toast }}</span>
        <button type="button" aria-label="Dismiss notification" @click="ui.toast = ''">×</button>
      </div>
    </Transition>

    <div v-if="ui.confirm" class="modal-backdrop confirm-backdrop" @click.self="resolveConfirmation(false)">
      <section class="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" :aria-describedby="'confirm-message'">
        <span class="confirm-icon" :class="`confirm-icon--${ui.confirm.tone}`" aria-hidden="true">{{ ui.confirm.tone === 'danger' ? '!' : '✓' }}</span>
        <h2 id="confirm-title">{{ ui.confirm.title }}</h2>
        <p id="confirm-message">{{ ui.confirm.message }}</p>
        <div class="confirm-actions">
          <button class="secondary-button" type="button" @click="resolveConfirmation(false)">Cancel</button>
          <button class="primary-button" :class="{ 'danger-button': ui.confirm.tone === 'danger' }" type="button" @click="resolveConfirmation(true)">{{ ui.confirm.confirmLabel }}</button>
        </div>
      </section>
    </div>

    <div v-if="account.showAuth" class="modal-backdrop auth-backdrop" @click.self="closeAuth">
      <section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button class="modal-close" type="button" aria-label="Close sign in" @click="closeAuth">×</button>
        <div class="auth-brand"><span class="brand-mark">A</span></div>
        <p class="eyebrow">YOUR ANGELES, YOUR WAY</p>
        <h2 id="auth-title">{{ account.authMode === 'signup' ? 'Create your account' : 'Welcome back' }}</h2>
        <p class="auth-description">Save the places you love and keep your next trip close.</p>
        <form class="auth-form" @submit.prevent="submitAuth">
          <label v-if="account.authMode === 'signup'">
            <span>Your name</span>
            <input v-model.trim="authName" required maxlength="60" autocomplete="name" placeholder="e.g. Alex Santos" />
          </label>
          <label>
            <span>Email address</span>
            <input v-model.trim="authEmail" required type="email" maxlength="254" autocomplete="email" placeholder="you@example.com" />
          </label>
          <label>
            <span>Password</span>
            <input v-model="authPassword" required type="password" minlength="8" maxlength="72" :autocomplete="account.authMode === 'signup' ? 'new-password' : 'current-password'" placeholder="At least 8 characters" />
          </label>
          <p v-if="authError" class="auth-error" role="alert">{{ authError }}</p>
          <button class="btn-search auth-submit" type="submit" :disabled="authBusy">
            {{ authBusy ? 'Please wait…' : account.authMode === 'signup' ? 'Create account' : 'Sign in' }}
            <span v-if="!authBusy" aria-hidden="true">↗</span>
          </button>
        </form>
        <p class="auth-switch">
          {{ account.authMode === 'signup' ? 'Already have an account?' : 'New to Angeles Discovery?' }}
          <button type="button" @click="switchAuthMode">{{ account.authMode === 'signup' ? 'Sign in' : 'Create an account' }}</button>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { account, initializeAccount, signOut as clearAccount, signIn, signUp, ui, resolveConfirmation } from './state.js';

const router = useRouter();
const route = useRoute();
const authName = ref('');
const authEmail = ref('');
const authPassword = ref('');
const authError = ref('');
const authBusy = ref(false);
const mobileNavOpen = ref(false);

watch(() => route.path, () => { mobileNavOpen.value = false; });

watch(() => account.showAuth, (isOpen) => {
  if (isOpen) {
    authError.value = '';
    authName.value = '';
    authEmail.value = '';
    authPassword.value = '';
  }
});

function openAuth(mode = 'login') {
  account.authMode = mode;
  account.showAuth = true;
}

function closeAuth() {
  account.showAuth = false;
}

function switchAuthMode() {
  account.authMode = account.authMode === 'signup' ? 'login' : 'signup';
  authError.value = '';
}

async function submitAuth() {
  authBusy.value = true;
  authError.value = '';
  try {
    if (account.authMode === 'signup') {
      await signUp(authName.value, authEmail.value, authPassword.value);
    } else {
      await signIn(authEmail.value, authPassword.value);
    }
    closeAuth();
    const nextPath = router.currentRoute.value.query.next;
    if (typeof nextPath === 'string' && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
      await router.push(nextPath);
    } else if (router.currentRoute.value.query.saved === '1') {
      await router.push({ path: '/discover', query: { saved: '1' } });
    }
  } catch (error) {
    authError.value = error.message || 'We could not complete sign in. Please try again.';
  } finally {
    authBusy.value = false;
  }
}

async function goToSaved() {
  await router.push({ path: '/discover', query: { saved: '1' } });
}

function signOut() {
  clearAccount();
  if (router.currentRoute.value.query.saved === '1') router.push('/discover');
}

function onEscape(event) {
  if (event.key !== 'Escape') return;
  if (account.showAuth) closeAuth();
  if (ui.confirm) resolveConfirmation(false);
  mobileNavOpen.value = false;
}

onMounted(() => {
  window.addEventListener('keydown', onEscape);
  initializeAccount();
});
onUnmounted(() => window.removeEventListener('keydown', onEscape));
</script>
