<template>
  <main class="admin-page">
    <section class="admin-heading">
      <div><p class="eyebrow">ADMINISTRATION / CONTROL ROOM</p><h1>Make this guide yours.</h1><p>Keep destination information useful, accurate, and welcoming.</p></div>
      <span class="admin-badge">ADMIN ACCESS</span>
    </section>

    <div class="admin-content">
      <p v-if="error" class="data-message data-message--notice" role="alert">{{ error }}</p>
      <p v-if="notice" class="admin-notice" role="status">✓ {{ notice }}</p>

      <section class="admin-panel">
        <div class="admin-panel-heading">
          <div><p class="eyebrow">DIRECTORY</p><h2>{{ editingId ? 'Edit destination' : 'Add a destination' }}</h2><p class="admin-panel-copy">Complete details help visitors decide where to go next.</p></div>
          <button v-if="editingId" class="secondary-button" type="button" @click="resetForm">Cancel editing</button>
        </div>
        <form class="admin-place-form" @submit.prevent="savePlace">
          <label><span>Place name</span><input v-model.trim="form.name" required minlength="2" maxlength="100" placeholder="e.g. Museo Ning Angeles" /></label>
          <label><span>Category</span><select v-model="form.category" required><option value="Restaurant">Food &amp; Dining</option><option value="Heritage">Heritage &amp; Culture</option><option value="Adventure">Adventure &amp; Nature</option><option value="Entertainment">Entertainment &amp; Leisure</option></select></label>
          <label class="admin-form-wide"><span>Image URL</span><input v-model.trim="form.image" type="url" required maxlength="1000" placeholder="https://…" /></label>
          <div v-if="form.image" class="admin-image-preview admin-form-wide">
            <img :src="form.image" alt="Preview of the destination image" @error="previewBroken = true" @load="previewBroken = false" />
            <div><strong>Image preview</strong><span>{{ previewBroken ? 'This image could not be loaded. Check the URL.' : 'Check that the image matches this destination.' }}</span></div>
          </div>
          <label><span>Area / district</span><input v-model.trim="form.location" required maxlength="160" placeholder="Angeles City, Pampanga" /></label>
          <label><span>Full address</span><input v-model.trim="form.address" maxlength="240" placeholder="Street, district, city" /></label>
          <label><span>Price / entry</span><input v-model.trim="form.price" maxlength="100" placeholder="Free entry, ₱₱, or verify with venue" /></label>
          <label><span>Opening hours / visitor note</span><input v-model.trim="form.hours" maxlength="180" placeholder="Use a verification note if unsure" /></label>
          <label><span>Contact number</span><input v-model.trim="form.phone" maxlength="40" placeholder="Optional" /></label>
          <label><span>Official website</span><input v-model.trim="form.website" type="url" maxlength="300" placeholder="https://… (optional)" /></label>
          <label><span>Details last checked</span><input v-model.trim="form.lastVerified" maxlength="40" placeholder="e.g. 12 Oct 2026 (only after checking)" /></label>
          <label><span>Best time to visit <small>Optional · verify first</small></span><input v-model.trim="form.bestTime" maxlength="140" placeholder="e.g. Visit before the evening rush" /></label>
          <label class="admin-form-wide"><span>Visitor tips <small>Optional · practical details</small></span><textarea v-model.trim="form.tips" maxlength="280" rows="2" placeholder="Useful etiquette, booking tips, age restrictions, or what to bring" /></label>
          <label class="admin-form-wide"><span>Description</span><textarea v-model.trim="form.description" required minlength="10" maxlength="1000" rows="3" placeholder="What should a visitor know about this place?" /></label>
          <label><span>Popularity score <small>0–100 · editorial</small></span><input v-model.number="form.popularity" type="number" min="0" max="100" required /></label>
          <label><span>Recommendation order <small>lower appears first</small></span><input v-model.number="form.recommendedRank" type="number" min="1" max="1000" required /></label>
          <div class="admin-form-actions admin-form-wide"><button class="primary-button" type="submit" :disabled="busy || previewBroken">{{ busy ? 'Saving…' : editingId ? 'Save changes' : 'Add destination' }} <span aria-hidden="true">↗</span></button><button v-if="editingId" class="secondary-button" type="button" @click="resetForm">Discard changes</button></div>
        </form>
      </section>

      <section class="admin-panel">
        <div class="admin-panel-heading"><div><p class="eyebrow">PUBLISHED LISTINGS</p><h2>Destinations <span class="profile-count">{{ adminPlaces.length }}</span></h2></div><button class="refresh-button" type="button" :disabled="loading" @click="refreshAdmin">{{ loading ? 'Refreshing…' : 'Refresh' }}</button></div>
        <p v-if="loading" class="data-message">Loading listings…</p>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Place</th><th>Category</th><th>Rating</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="place in adminPlaces" :key="place.id">
                <td><strong>{{ place.name }}</strong><small>{{ place.address || place.location }}</small><small v-if="place.lastVerified">Checked {{ place.lastVerified }}</small></td>
                <td>{{ place.category }}</td>
                <td><template v-if="place.reviewCount">★ {{ Number(place.rating || 0).toFixed(1) }}<small>{{ place.reviewCount }} visitor reviews</small></template><template v-else><small>Curated score: {{ Number(place.rating || 0).toFixed(1) }} · no reviews</small></template></td>
                <td class="admin-actions"><button type="button" @click="editPlace(place)">Edit</button><button class="delete-action" type="button" :disabled="deletingId === place.id" @click="removePlace(place)">{{ deletingId === place.id ? 'Deleting…' : 'Delete' }}</button></td>
              </tr>
              <tr v-if="!loading && !adminPlaces.length"><td colspan="4" class="table-empty">No destinations yet. Add the first listing above.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="admin-panel">
        <div class="admin-panel-heading"><div><p class="eyebrow">FROM THE COMMUNITY</p><h2>Suggestions <span class="profile-count">{{ suggestions.length }}</span></h2><p class="admin-panel-copy">Mark each submission as it moves through your review process.</p></div><button class="refresh-button" type="button" :disabled="suggestionsLoading" @click="refreshSuggestions">{{ suggestionsLoading ? 'Refreshing…' : 'Refresh' }}</button></div>
        <p v-if="suggestionsLoading" class="data-message">Loading suggestions…</p>
        <article v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-card">
          <div class="suggestion-meta"><span>{{ suggestion.topic }}</span><time :datetime="suggestion.createdAt">{{ formatDate(suggestion.createdAt) }}</time></div>
          <p>{{ suggestion.message }}</p>
          <div class="suggestion-bottom"><div class="suggestion-author">{{ suggestion.name || 'Visitor' }}<span v-if="suggestion.email"> · {{ suggestion.email }}</span></div><label class="suggestion-status"><span>Status</span><select :value="suggestion.status || 'Pending'" :disabled="updatingSuggestionId === suggestion.id" @change="changeSuggestionStatus(suggestion, $event.target.value)"><option>Pending</option><option>Reviewed</option><option>Resolved</option></select></label></div>
        </article>
        <p v-if="!suggestionsLoading && !suggestions.length" class="profile-empty">No suggestions yet.</p>
      </section>

      <section class="admin-panel">
        <div class="admin-panel-heading"><div><p class="eyebrow">COMMUNITY STANDARDS</p><h2>Review moderation <span class="profile-count">{{ adminReviews.length }}</span></h2><p class="admin-panel-copy">Remove spam or content that violates the site's review guidelines.</p></div><button class="refresh-button" type="button" :disabled="reviewsLoading" @click="refreshReviews">{{ reviewsLoading ? 'Refreshing…' : 'Refresh' }}</button></div>
        <p v-if="reviewsLoading" class="data-message">Loading visitor reviews…</p>
        <article v-for="review in adminReviews" :key="review.id" class="moderation-review">
          <div class="moderation-review-top"><div><strong>{{ review.placeName }}</strong><span>★ {{ review.rating }} · {{ review.name }}</span></div><time :datetime="review.createdAt">{{ formatDate(review.createdAt) }}</time></div>
          <p>{{ review.text }}</p>
          <div class="moderation-review-bottom"><span>{{ review.likes }} {{ review.likes === 1 ? 'like' : 'likes' }}</span><button class="delete-review-button" type="button" :disabled="deletingReviewId === review.id" @click="removeReview(review)">{{ deletingReviewId === review.id ? 'Removing…' : 'Remove review' }}</button></div>
        </article>
        <p v-if="!reviewsLoading && !adminReviews.length" class="profile-empty">No visitor reviews to moderate yet.</p>
      </section>
    </div>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { deleteAdminPlace, loadAdminPlaces, loadAdminSuggestions, saveAdminPlace, loadAdminReviews, deleteAdminReview, updateSuggestionStatus, confirmAction, showToast } from '../state.js';

const adminPlaces = ref([]);
const suggestions = ref([]);
const adminReviews = ref([]);
const error = ref('');
const notice = ref('');
const loading = ref(true);
const suggestionsLoading = ref(true);
const reviewsLoading = ref(true);
const busy = ref(false);
const deletingId = ref('');
const deletingReviewId = ref('');
const updatingSuggestionId = ref('');
const editingId = ref('');
const previewBroken = ref(false);
const form = reactive(blankPlace());

function blankPlace() {
  return { name: '', category: 'Restaurant', image: '', location: '', address: '', price: '', hours: '', phone: '', website: '', lastVerified: '', bestTime: '', tips: '', description: '', popularity: 50, recommendedRank: 20 };
}

async function refreshAdmin() {
  error.value = '';
  loading.value = true;
  try { adminPlaces.value = await loadAdminPlaces(); }
  catch (requestError) { error.value = requestError.message; }
  finally { loading.value = false; }
}

async function refreshSuggestions() {
  suggestionsLoading.value = true;
  try { suggestions.value = await loadAdminSuggestions(); }
  catch (requestError) { error.value = requestError.message; }
  finally { suggestionsLoading.value = false; }
}

async function refreshReviews() {
  reviewsLoading.value = true;
  try { adminReviews.value = await loadAdminReviews(); }
  catch (requestError) { error.value = requestError.message; }
  finally { reviewsLoading.value = false; }
}

function editPlace(place) {
  editingId.value = place.id;
  Object.assign(form, blankPlace(), {
    name: place.name, category: place.category, image: place.image, location: place.location,
    address: place.address || '', price: place.price || '', hours: place.hours || '', phone: place.phone || '',
    website: place.website || '', lastVerified: place.lastVerified || '', bestTime: place.bestTime || '', tips: place.tips || '', description: place.description,
    popularity: Number(place.popularity) || 0, recommendedRank: Number(place.recommendedRank) || 20
  });
  previewBroken.value = false;
  error.value = '';
  notice.value = '';
  document.querySelector('.admin-place-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  editingId.value = '';
  Object.assign(form, blankPlace());
  previewBroken.value = false;
}

async function savePlace() {
  busy.value = true;
  error.value = '';
  notice.value = '';
  try {
    const result = await saveAdminPlace({ ...form }, editingId.value);
    notice.value = editingId.value ? `${result.name} was updated.` : `${result.name} was added to the directory.`;
    showToast(notice.value);
    resetForm();
    await refreshAdmin();
  } catch (requestError) { error.value = requestError.message; showToast(requestError.message, 'error'); }
  finally { busy.value = false; }
}

async function removePlace(place) {
  const confirmed = await confirmAction({ title: `Delete ${place.name}?`, message: 'This removes the destination and its visitor reviews from the directory. Saved-place references will also be cleared.', confirmLabel: 'Delete destination', tone: 'danger' });
  if (!confirmed) return;
  deletingId.value = place.id;
  error.value = '';
  notice.value = '';
  try {
    await deleteAdminPlace(place.id);
    adminPlaces.value = adminPlaces.value.filter((item) => item.id !== place.id);
    adminReviews.value = adminReviews.value.filter((review) => review.placeId !== place.id);
    notice.value = `${place.name} was deleted.`;
    showToast(notice.value, 'info');
    if (editingId.value === place.id) resetForm();
  } catch (requestError) { error.value = requestError.message; showToast(requestError.message, 'error'); }
  finally { deletingId.value = ''; }
}

async function changeSuggestionStatus(suggestion, status) {
  updatingSuggestionId.value = suggestion.id;
  error.value = '';
  try {
    await updateSuggestionStatus(suggestion.id, status);
    suggestion.status = status;
    showToast(`Suggestion marked ${status.toLowerCase()}.`);
  } catch (requestError) { error.value = requestError.message; showToast(requestError.message, 'error'); await refreshSuggestions(); }
  finally { updatingSuggestionId.value = ''; }
}

async function removeReview(review) {
  const confirmed = await confirmAction({ title: 'Remove this review?', message: `The review for ${review.placeName} will be permanently removed. This should only be used for spam or inappropriate content.`, confirmLabel: 'Remove review', tone: 'danger' });
  if (!confirmed) return;
  deletingReviewId.value = review.id;
  try {
    await deleteAdminReview(review.id);
    adminReviews.value = adminReviews.value.filter((item) => item.id !== review.id);
    showToast('Review removed.', 'info');
    await refreshAdmin();
  } catch (requestError) { error.value = requestError.message; showToast(requestError.message, 'error'); }
  finally { deletingReviewId.value = ''; }
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

onMounted(() => { refreshAdmin(); refreshSuggestions(); refreshReviews(); });
</script>
