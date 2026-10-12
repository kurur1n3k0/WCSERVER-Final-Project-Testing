<template>
  <main class="profile-page">
    <section class="profile-banner">
      <div class="profile-avatar">{{ account.user?.name.charAt(0).toUpperCase() }}</div>
      <div>
        <p class="eyebrow">YOUR ANGELES NOTEBOOK</p>
        <h1>{{ account.user?.name }}</h1>
        <p>{{ account.user?.email }}</p>
      </div>
    </section>

    <section class="profile-content">
      <p v-if="error" class="data-message data-message--notice" role="alert">{{ error }}</p>
      <p v-if="loading" class="data-message" role="status">Gathering your travel notes…</p>

      <section class="profile-section">
        <div class="section-heading profile-section-heading">
          <div><p class="eyebrow">YOUR PERSONAL SHORTLIST</p><h2>Saved places <span class="profile-count">{{ profile.savedPlaces.length }}</span></h2></div>
          <RouterLink class="clear-saved" to="/discover">Find more places <span aria-hidden="true">↗</span></RouterLink>
        </div>
        <div v-if="profile.savedPlaces.length" class="discovery-grid profile-grid">
          <PlaceCard
            v-for="place in profile.savedPlaces"
            :key="place.id"
            :place="place"
            :rating="Number(place.rating) || 0"
            :saved="true"
            @select="openPlace"
            @toggle-save="removeSaved"
          />
        </div>
        <p v-else-if="!loading" class="profile-empty">Your shortlist is empty for now. Save a place from Discover to keep it here.</p>
      </section>

      <section class="profile-section">
        <div class="section-heading profile-section-heading">
          <div><p class="eyebrow">YOUR COMMUNITY NOTES</p><h2>Reviews &amp; ratings <span class="profile-count">{{ profile.reviews.length }}</span></h2></div>
        </div>
        <div v-if="profile.reviews.length" class="profile-reviews">
          <article v-for="review in profile.reviews" :key="review.id" class="profile-review">
            <div class="profile-review-top">
              <div><span class="review-rating">★ {{ review.rating }}</span><RouterLink :to="{ path: '/discover', query: { place: review.placeId } }">{{ review.placeName }}</RouterLink></div>
              <time :datetime="review.createdAt">{{ formatDate(review.createdAt) }}</time>
            </div>
            <p>{{ review.text }}</p>
            <div class="profile-review-actions">
              <div class="review-likes"><span aria-hidden="true">♥</span> {{ review.likes }} {{ review.likes === 1 ? 'person likes' : 'people like' }} this note</div>
              <div class="profile-review-buttons">
                <RouterLink class="text-button" :to="{ path: '/discover', query: { place: review.placeId } }">Edit review ↗</RouterLink>
                <button class="delete-review-button" type="button" :disabled="deletingReviewId === review.id" @click="removeReview(review)">{{ deletingReviewId === review.id ? 'Removing…' : 'Remove review' }}</button>
              </div>
            </div>
          </article>
        </div>
        <p v-else-if="!loading" class="profile-empty">Your ratings and reviews will show up here after you leave a note on a place.</p>
      </section>

      <section class="profile-section">
        <div class="section-heading profile-section-heading">
          <div><p class="eyebrow">KIND WORDS YOU LEFT</p><h2>Notes you liked <span class="profile-count">{{ profile.likedReviews.length }}</span></h2></div>
        </div>
        <div v-if="profile.likedReviews.length" class="profile-reviews">
          <article v-for="review in profile.likedReviews" :key="review.id" class="profile-review">
            <div class="profile-review-top">
              <div><span class="review-rating">★ {{ review.rating }}</span><RouterLink :to="{ path: '/discover', query: { place: review.placeId } }">{{ review.placeName }}</RouterLink></div>
              <button class="like-review liked" type="button" aria-label="Unlike review" @click="unlike(review)">♥ Liked · {{ review.likes }}</button>
            </div>
            <p class="liked-byline">By {{ review.name }}</p>
            <p>{{ review.text }}</p>
            <div class="review-likes"><span aria-hidden="true">♡</span> {{ review.likes }} {{ review.likes === 1 ? 'person likes' : 'people like' }} this note</div>
          </article>
        </div>
        <p v-else-if="!loading" class="profile-empty">When you like a visitor review, you can find it here.</p>
      </section>
    </section>

    <div v-if="selectedPlace" class="modal-backdrop" @click.self="selectedPlace = null">
      <section class="place-modal profile-place-modal" role="dialog" aria-modal="true" :aria-label="selectedPlace.name">
        <button class="modal-close" type="button" aria-label="Close place details" @click="selectedPlace = null">×</button>
        <img class="modal-image" :src="selectedPlace.image" :alt="selectedPlace.name" @error="hideBrokenImage" />
        <div class="modal-content"><p class="eyebrow">{{ selectedPlace.category }} <span>·</span> {{ selectedPlace.location }}</p><h2>{{ selectedPlace.name }}</h2><p class="modal-description">{{ selectedPlace.description }}</p><a class="map-link" :href="mapUrl(selectedPlace)" target="_blank" rel="noopener noreferrer">Open in Google Maps <span aria-hidden="true">↗</span></a></div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import PlaceCard from '../components/PlaceCard.vue';
import { account, apiRequest, places, loadProfile, toggleFavorite, toggleReviewLike, addTripPlace, deleteOwnReview, confirmAction, showToast } from '../state.js';

const profile = reactive({ savedPlaces: [], reviews: [], likedReviews: [] });
const route = useRoute();
const loading = ref(true);
const error = ref('');
const selectedPlace = ref(null);
const deletingReviewId = ref('');

async function refreshProfile() {
  const data = await loadProfile();
  profile.savedPlaces = data.savedPlaces;
  profile.reviews = data.reviews;
  profile.likedReviews = data.likedReviews;
}

async function removeSaved(place) {
  try {
    await toggleFavorite(place.id);
    await refreshProfile();
    showToast(`${place.name} removed from saved places.`, 'info');
  } catch (requestError) {
    error.value = requestError.message;
    showToast(requestError.message, 'error');
  }
}

function addToTrip(place) {
  const added = addTripPlace(place.id);
  showToast(added ? `${place.name} added to your day plan.` : `${place.name} is already in your trip.`, added ? 'success' : 'info');
}

async function removeReview(review) {
  const confirmed = await confirmAction({ title: 'Remove your review?', message: `Your review for ${review.placeName} and its rating will be removed. You can leave a new review later.`, confirmLabel: 'Remove review', tone: 'danger' });
  if (!confirmed) return;
  deletingReviewId.value = review.id;
  error.value = '';
  try {
    const result = await deleteOwnReview(review.id);
    profile.reviews = profile.reviews.filter((item) => item.id !== review.id);
    profile.likedReviews = profile.likedReviews.filter((item) => item.id !== review.id);
    const updated = places.value.find((place) => String(place.id) === String(result.placeId));
    if (updated) {
      updated.rating = result.rating;
      updated.reviewCount = result.reviewCount;
      updated.ratingSource = result.ratingSource;
    }
    const savedCopy = profile.savedPlaces.find((place) => String(place.id) === String(result.placeId));
    if (savedCopy) {
      savedCopy.rating = result.rating;
      savedCopy.reviewCount = result.reviewCount;
      savedCopy.ratingSource = result.ratingSource;
    }
    showToast('Your review was removed.', 'info');
  } catch (requestError) {
    error.value = requestError.message || 'Your review could not be removed.';
    showToast(error.value, 'error');
  } finally {
    deletingReviewId.value = '';
  }
}

async function unlike(review) {
  try {
    const result = await toggleReviewLike(review.id);
    profile.likedReviews = profile.likedReviews.filter((item) => item.id !== review.id);
    profile.reviews = profile.reviews.map((item) => item.id === review.id ? { ...item, likes: result.likes, likedByMe: result.likedByMe } : item);
  } catch (requestError) {
    error.value = requestError.message;
  }
}

function openPlace(place) {
  selectedPlace.value = place;
}
function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}
function mapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.location || 'Angeles City, Pampanga'}`)}`;
}
function hideBrokenImage(event) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = '/images/destination-placeholder.svg';
  image.alt = `${image.alt || 'Destination'} photo unavailable`;
}

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    if (!places.value.length) {
      const data = await apiRequest('/api/places');
      places.value = data;
    }
    await refreshProfile();
    if (route.query.place) {
      const place = places.value.find((item) => String(item.id) === String(route.query.place));
      if (place) openPlace(place);
    }
  } catch (requestError) {
    error.value = requestError.message || 'Your profile could not be loaded.';
  } finally {
    loading.value = false;
  }
});
</script>
