import { reactive, ref } from 'vue';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


// Shared, branded feedback UI used instead of browser-native alert/confirm dialogs.
export const ui = reactive({ toast: '', toastType: 'success', confirm: null, confirmBusy: false });
let toastTimer;
let confirmResolver = null;

export function showToast(message, type = 'success') {
  ui.toast = String(message || 'Done.');
  ui.toastType = type;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { ui.toast = ''; }, 3400);
}

export function confirmAction({ title = 'Are you sure?', message = 'This action cannot be undone.', confirmLabel = 'Continue', tone = 'danger' } = {}) {
  if (confirmResolver) confirmResolver(false);
  ui.confirm = { title, message, confirmLabel, tone };
  ui.confirmBusy = false;
  return new Promise((resolve) => { confirmResolver = resolve; });
}

export function resolveConfirmation(accepted) {
  const resolve = confirmResolver;
  confirmResolver = null;
  ui.confirm = null;
  ui.confirmBusy = false;
  if (resolve) resolve(Boolean(accepted));
}

const savedTrip = (() => {
  try {
    const parsed = JSON.parse(localStorage.getItem('angeles-trip') || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id != null).map((item) => ({ id: String(item.id), period: ['Morning', 'Afternoon', 'Evening'].includes(item.period) ? item.period : 'Morning' })) : [];
  } catch { return []; }
})();
export const tripItems = ref(savedTrip);

function persistTrip() {
  localStorage.setItem('angeles-trip', JSON.stringify(tripItems.value));
}

export function addTripPlace(placeId) {
  const id = String(placeId);
  if (tripItems.value.some((item) => item.id === id)) return false;
  tripItems.value.push({ id, period: tripItems.value.length < 2 ? 'Morning' : tripItems.value.length < 4 ? 'Afternoon' : 'Evening' });
  persistTrip();
  return true;
}

export function removeTripPlace(placeId) {
  tripItems.value = tripItems.value.filter((item) => item.id !== String(placeId));
  persistTrip();
}

export function setTripPeriod(placeId, period) {
  if (!['Morning', 'Afternoon', 'Evening'].includes(period)) return;
  const item = tripItems.value.find((entry) => entry.id === String(placeId));
  if (item) { item.period = period; persistTrip(); }
}

export function moveTripPlace(placeId, direction) {
  const index = tripItems.value.findIndex((item) => item.id === String(placeId));
  const target = index + direction;
  if (index < 0 || target < 0 || target >= tripItems.value.length) return;
  const updated = [...tripItems.value];
  [updated[index], updated[target]] = [updated[target], updated[index]];
  tripItems.value = updated;
  persistTrip();
}

export const account = reactive({
  token: localStorage.getItem('angeles-token') || '',
  user: null,
  favoriteIds: [],
  showAuth: false,
  authMode: 'login'
});

export const places = ref([]);
export const placesError = ref('');
export const placesLoading = ref(false);
export const authReady = ref(false);

const fallbackPlaces = [
  {
    id: '1', name: "Aling Lucing's Sisig", category: 'Restaurant', rating: 4.8, popularity: 98, recommendedRank: 1,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Aling_Lucing_The_Sisig_Queen_Restaurant,_Angeles,_Pampanga,_Aug_2026_(1).jpg?width=1000',
    price: '₱₱', location: 'Angeles City', address: 'Glaciano Valdez Street, Angeles City, Pampanga', hours: 'Verify hours before visiting', lastVerified: '', bestTime: '', tips: '',
    description: 'A much-loved stop for the sizzling Kapampangan dish that put sisig on the map. Come hungry and bring your appetite for local flavor.'
  },
  {
    id: '5', name: 'Café Fleur', category: 'Restaurant', rating: 4.7, popularity: 92, recommendedRank: 2,
    image: 'https://capitaltownpampanga.com.ph/wp-content/uploads/2018/07/cafe-fleur-2.jpg',
    price: '₱₱₱', location: 'Angeles City', address: 'The Garden, Dycaico Ancestral House, Santo Rosario Street, Angeles City, Pampanga',
    phone: '+63 995 313 8413', hours: 'Verify hours with the venue before visiting', lastVerified: '', bestTime: '', tips: '',
    description: 'A thoughtful take on Kapampangan cuisine, where familiar regional flavors meet a contemporary dining experience.'
  },
  {
    id: '2', name: 'Museo Ning Angeles', category: 'Heritage', rating: 4.5, popularity: 78, recommendedRank: 5,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo_Ning_Angeles.jpg?width=1000',
    price: 'Check with the venue', location: 'Heritage District', address: 'Santo Rosario Street, Angeles City, Pampanga', hours: 'Verify museum hours before visiting', lastVerified: '', bestTime: '', tips: '',
    description: "Get to know the city's story inside this heritage museum, set in a restored historic building near the town plaza."
  },
  {
    id: '6', name: 'Holy Rosary Parish Church', category: 'Heritage', rating: 4.8, popularity: 87, recommendedRank: 4,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Holy_Rosary_Parish_Church_(Angeles_City,_Pampanga).jpg?width=1000',
    price: 'Free entry', location: 'Heritage District', address: 'Santo Rosario Street, Angeles City, Pampanga', hours: 'Please be mindful of services and visiting hours', lastVerified: '', bestTime: '', tips: '',
    description: "A landmark of the Heritage District and a striking place to pause and admire the city's architecture and history."
  },
  {
    id: '4', name: 'Pamintuan Mansion', category: 'Heritage', rating: 4.6, popularity: 74, recommendedRank: 6,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pamintuan_Mansion_in_Angeles_City,_Pampanga.jpg?width=1000',
    price: 'Check with the venue', location: 'Heritage District', address: 'Santo Rosario Street, Angeles City, Pampanga', hours: 'Verify museum hours before visiting', lastVerified: '', bestTime: '', tips: '',
    description: 'Step into a piece of Philippine history at this beautifully preserved mansion, an essential stop on an old-town wander.'
  },
  {
    id: '7', name: 'Sandbox at Alviera', category: 'Adventure', rating: 4.6, popularity: 81, recommendedRank: 7,
    image: 'https://3.bp.blogspot.com/-l7G4TrRipdU/V0sC05YSnUI/AAAAAAAABE4/WhBsXv6mbcUcrlO86jwFDgWN9VsFeOVDQCLcB/s1600/10245278_1277025235644923_3524498971041076126_n.jpg',
    price: 'Varies by activity', location: 'Porac, Pampanga', hours: 'Check activity schedules before visiting', lastVerified: '', bestTime: '', tips: '',
    description: 'Make room for a little adventure at this outdoor playground, with activities and open spaces for a fun day out with friends or family.'
  },
  {
    id: '3', name: 'Aqua Planet', category: 'Entertainment', rating: 4.7, popularity: 96, recommendedRank: 3,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Aqua_Planet.jpg?width=1000',
    price: 'Check current ticket prices', location: 'Clark Freeport Zone', address: 'Clark Freeport Zone, Mabalacat, Pampanga', hours: 'Check operating schedule before visiting', lastVerified: '', bestTime: '', tips: '',
    description: "A full day of splashes and slides awaits at one of the region's best-known water parks in Clark."
  },
  {
    id: '8', name: 'Walking Street', category: 'Entertainment', rating: 4.3, popularity: 90, recommendedRank: 8,
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Angeles_City_Malaba%C3%B1as%2C_Fields_Avenue_night_view_%28Angeles%2C_Pampanga%3B_05-27-2023%29.jpg',
    price: 'Free to explore', location: 'Balibago, Angeles City', hours: 'Best explored in the evening', lastVerified: '', bestTime: '', tips: '',
    description: 'A lively stretch of restaurants, music, and nightlife. Explore with your group, stay aware of your surroundings, and choose the spots that suit you.'
  }
];

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (account.token) headers.set('Authorization', `Bearer ${account.token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an unreadable response.');
  }
  if (!response.ok) {
    if (response.status === 401 && account.token) signOut();
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

export async function loadPlaces() {
  placesLoading.value = true;
  placesError.value = '';
  try {
    const data = await apiRequest('/api/places');
    if (!Array.isArray(data)) throw new Error('The places service returned invalid data.');
    places.value = data;
  } catch (error) {
    places.value = fallbackPlaces;
    placesError.value = `Could not reach the live directory: ${error.message}. Showing sample places.`;
    console.error('Unable to load places:', error);
  } finally {
    placesLoading.value = false;
  }
}

function saveSession(session) {
  account.token = session.token;
  account.user = session.user;
  account.favoriteIds = session.favoriteIds || [];
  localStorage.setItem('angeles-token', session.token);
}

export async function signUp(name, email, password) {
  const session = await apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  saveSession(session);
}

export async function signIn(email, password) {
  const session = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  saveSession(session);
}

export async function initializeAccount() {
  if (!account.token) {
    authReady.value = true;
    return;
  }
  try {
    const result = await apiRequest('/api/auth/me');
    account.user = result.user;
    account.favoriteIds = result.favoriteIds || [];
  } catch (error) {
    console.error('Unable to restore the signed-in account:', error);
    signOut();
  } finally {
    authReady.value = true;
  }
}

export function signOut() {
  account.token = '';
  account.user = null;
  account.favoriteIds = [];
  localStorage.removeItem('angeles-token');
}

export async function toggleFavorite(placeId) {
  if (!account.user) {
    account.authMode = 'login';
    account.showAuth = true;
    return;
  }

  const id = String(placeId);
  const isSaved = account.favoriteIds.includes(id);
  const result = await apiRequest(`/api/account/favorites/${encodeURIComponent(id)}`, {
    method: isSaved ? 'DELETE' : 'PUT'
  });
  account.favoriteIds = result.favoriteIds;
}

export async function loadReviews(placeId) {
  return apiRequest(`/api/places/${encodeURIComponent(placeId)}/reviews`);
}

export async function submitReview(placeId, rating, text) {
  if (!account.user) {
    account.authMode = 'login';
    account.showAuth = true;
    throw new Error('Sign in to share a review.');
  }
  return apiRequest(`/api/places/${encodeURIComponent(placeId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, text })
  });
}

export async function submitSuggestion(suggestion) {
  return apiRequest('/api/suggestions', {
    method: 'POST',
    body: JSON.stringify(suggestion)
  });
}

export async function loadProfile() {
  return apiRequest('/api/account/profile');
}

export async function toggleReviewLike(reviewId) {
  return apiRequest(`/api/reviews/${encodeURIComponent(reviewId)}/like`, {
    method: 'PUT'
  });
}

export async function loadAdminPlaces() {
  return apiRequest('/api/admin/places');
}

export async function saveAdminPlace(place, placeId) {
  return apiRequest(placeId ? `/api/admin/places/${encodeURIComponent(placeId)}` : '/api/admin/places', {
    method: placeId ? 'PUT' : 'POST',
    body: JSON.stringify(place)
  });
}

export async function deleteAdminPlace(placeId) {
  return apiRequest(`/api/admin/places/${encodeURIComponent(placeId)}`, {
    method: 'DELETE'
  });
}

export async function loadAdminSuggestions() {
  return apiRequest('/api/admin/suggestions');
}


export async function deleteOwnReview(reviewId) {
  return apiRequest(`/api/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' });
}

export async function loadAdminReviews() {
  return apiRequest('/api/admin/reviews');
}

export async function deleteAdminReview(reviewId) {
  return apiRequest(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' });
}

export async function updateSuggestionStatus(suggestionId, status) {
  return apiRequest(`/api/admin/suggestions/${encodeURIComponent(suggestionId)}`, {
    method: 'PATCH', body: JSON.stringify({ status })
  });
}
