<template>
  <main class="discover-page">
    <section class="discover-banner">
      <div class="discover-banner-copy">
        <p class="eyebrow">A LOCAL'S LITTLE BLACK BOOK</p>
        <h1>Angeles, at your<br /><em>own pace.</em></h1>
        <p>From first bite to last stop, find the places worth making time for.</p>
      </div>
      <form class="search-bar discover-search" role="search" @submit.prevent="applySearch">
        <span class="search-icon" aria-hidden="true">⌕</span>
        <input v-model="queryInput" type="search" aria-label="Search places" placeholder="Search food, heritage, day trips…" />
        <button class="btn-search" type="submit">Search <span aria-hidden="true">↗</span></button>
      </form>
      <span class="discover-banner-label">PAMPANGA, PHILIPPINES</span>
    </section>

    <div class="discover-body">
      <nav class="category-dock" aria-label="Browse by category">
        <button
          v-for="category in categories"
          :key="category.value"
          class="dock-category"
          :class="{ selected: activeCategory === category.value }"
          type="button"
          :aria-pressed="activeCategory === category.value"
          @click="chooseCategory(category.value)"
        >
          <span class="category-icon" :class="category.tone" aria-hidden="true">{{ category.icon }}</span>
          <span>{{ category.label }}</span>
        </button>
      </nav>

      <section class="discover-tools" aria-label="Filter and sort places">
        <div class="discover-tools-intro">
          <div><p class="eyebrow">YOUR WAY TO EXPLORE</p><h2>Find your kind of place.</h2></div>
          <p v-if="hasFilters" class="results-count">{{ filteredPlaces.length }} {{ filteredPlaces.length === 1 ? 'place' : 'places' }} found</p>
          <p v-else class="results-count">{{ places.length }} places to explore</p>
        </div>
        <div class="filter-control-row">
          <label><span>Budget</span><select v-model="selectedBudget" aria-label="Filter by budget"><option>Any budget</option><option>Free</option><option>Budget-friendly</option><option>Premium</option></select></label>
          <label><span>Rating</span><select v-model="minimumRating" aria-label="Filter by rating"><option>Any rating</option><option>4+ stars</option><option>4.5+ stars</option></select></label>
          <label><span>Sort by</span><select v-model="sortBy" aria-label="Sort places"><option>Recommended</option><option>Highest rated</option><option>Most reviewed</option><option value="Most popular">Popularity (curated)</option><option>Lowest price</option></select></label>
          <button v-if="hasFilters" class="filter-reset" type="button" @click="clearFilters">Reset filters <span aria-hidden="true">×</span></button>
        </div>
      </section>

      <section id="my-trip" class="trip-planner" aria-labelledby="trip-planner-title">
        <div class="trip-planner-heading">
          <div><p class="eyebrow">A LITTLE DAY-OUT PLAN</p><h2 id="trip-planner-title">Your day, in the making.</h2><p>Pick a few stops and make an easy itinerary of your own.</p></div>
          <div class="trip-planner-count"><strong>{{ tripPlaces.length }}</strong><span>{{ tripPlaces.length === 1 ? 'stop' : 'stops' }}</span></div>
        </div>
        <div v-if="tripPlaces.length" class="trip-list">
          <article v-for="(item, index) in tripPlaces" :key="item.id" class="trip-stop">
            <span class="trip-stop-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <img :src="item.image" :alt="item.name" loading="lazy" @error="hideBrokenImage" />
            <div class="trip-stop-info"><strong>{{ item.name }}</strong><span>{{ item.location }}</span></div>
            <label class="trip-period"><span class="sr-only">Time of day for {{ item.name }}</span><select :value="item.period" @change="setTripPeriod(item.id, $event.target.value)"><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
            <div class="trip-stop-actions">
              <button type="button" :disabled="index === 0" :aria-label="`Move ${item.name} up`" @click="moveTripPlace(item.id, -1)">↑</button>
              <button type="button" :disabled="index === tripPlaces.length - 1" :aria-label="`Move ${item.name} down`" @click="moveTripPlace(item.id, 1)">↓</button>
              <button type="button" :aria-label="`Remove ${item.name} from trip`" @click="removeTripItem(item)">×</button>
            </div>
          </article>
          <div class="trip-footer"><p>Saved on this device so your shortlist stays with you.</p><div><button class="text-button" type="button" @click="clearTrip">Clear trip</button><a class="primary-button" :href="tripDirectionsUrl" target="_blank" rel="noopener noreferrer" @click="onOpenTrip">Open route in Maps ↗</a></div></div>
        </div>
        <p v-else class="trip-empty"><span aria-hidden="true">＋</span> Add places to your day with the <strong>＋ Trip</strong> button on any destination card.</p>
      </section>

      <p v-if="placesError" class="data-message data-message--notice">{{ placesError }}</p>
      <p v-if="pageError" class="data-message data-message--notice" role="alert">{{ pageError }}</p>
      <p v-if="placesLoading" class="data-message" role="status">Finding lovely places for you…</p>

      <div v-if="savedOnly" class="section-heading saved-heading">
        <div>
          <p class="eyebrow">YOUR SHORTLIST</p>
          <h2>Saved places</h2>
          <p class="section-subtitle">A few good ideas, all in one place.</p>
        </div>
        <button class="clear-saved" type="button" @click="clearSavedView">Back to discovery <span aria-hidden="true">↗</span></button>
      </div>
      <div v-if="savedOnly" class="places-grid saved-grid">
        <PlaceCard
          v-for="place in savedPlaces"
          :key="place.id"
          :place="place"
          :rating="Number(place.rating) || 0"
          :saved="account.favoriteIds.includes(String(place.id))"
          @select="openPlace"
          @toggle-save="savePlace"
          @add-to-trip="addToTrip"
        />
      </div>
      <div v-if="savedOnly && !savedPlaces.length" class="empty-state">
        <span class="empty-icon">♡</span>
        <h3>No saved places yet</h3>
        <p>Tap the heart on any place to keep your trip ideas together.</p>
        <button class="text-button" type="button" @click="clearSavedView">Find places to save <span aria-hidden="true">→</span></button>
      </div>

      <template v-if="!savedOnly">
        <div v-if="hasFilters" class="filter-heading">
          <div>
            <p class="eyebrow">YOUR SEARCH</p>
            <h2>{{ activeCategory === 'All places' ? 'A few good finds.' : activeCategory }}</h2>
          </div>
          <button class="clear-saved" type="button" @click="clearFilters">Clear filters <span aria-hidden="true">×</span></button>
        </div>
        <section v-if="hasFilters" class="discovery-section search-results">
          <div class="discovery-grid">
            <PlaceCard
              v-for="place in filteredPlaces"
              :key="place.id"
              :place="place"
              :rating="Number(place.rating) || 0"
              :saved="account.favoriteIds.includes(String(place.id))"
              @select="openPlace"
              @toggle-save="savePlace"
          @add-to-trip="addToTrip"
            />
          </div>
          <div v-if="!filteredPlaces.length" class="empty-state">
            <span class="empty-icon">⌕</span>
            <h3>No places found</h3>
            <p>Try another search or choose a different category.</p>
            <button class="text-button" type="button" @click="clearFilters">Show all places <span aria-hidden="true">→</span></button>
          </div>
        </section>

        <template v-else>
          <section id="recommended" class="discovery-section">
            <SectionHeading eyebrow="HANDPICKED FOR YOU" title="Where to next?" note="A few local favorites to start your day." />
            <div class="discovery-grid">
              <PlaceCard
                v-for="place in recommendedPlaces"
                :key="place.id"
                :place="place"
                :rating="Number(place.rating) || 0"
                :saved="account.favoriteIds.includes(String(place.id))"
                @select="openPlace"
                @toggle-save="savePlace"
          @add-to-trip="addToTrip"
              />
            </div>
          </section>

          <section id="hot-spots" class="discovery-section">
            <SectionHeading eyebrow="LOCAL EDITORIAL PICKS" title="Hot spots" note="A curated shortlist of places worth considering—not a live popularity feed." />
            <div class="discovery-grid">
              <PlaceCard
                v-for="place in hotPlaces"
                :key="place.id"
                :place="place"
                :rating="Number(place.rating) || 0"
                :saved="account.favoriteIds.includes(String(place.id))"
                @select="openPlace"
                @toggle-save="savePlace"
          @add-to-trip="addToTrip"
              />
            </div>
          </section>

          <section id="best-places" class="discovery-section">
            <SectionHeading eyebrow="GOOD WORDS TRAVEL" title="Best places" note="Top rated by visitors in the Angeles community." />
            <div v-if="bestPlaces.length" class="discovery-grid">
              <PlaceCard
                v-for="place in bestPlaces"
                :key="place.id"
                :place="place"
                :rating="Number(place.rating) || 0"
                :saved="account.favoriteIds.includes(String(place.id))"
                @select="openPlace"
                @toggle-save="savePlace"
          @add-to-trip="addToTrip"
              />
            </div>
            <div v-else class="community-empty">
              <span aria-hidden="true">★</span>
              <p>Community ratings are just getting started.</p>
              <p>Open a place and be the first visitor to leave a rating.</p>
            </div>
          </section>
        </template>
      </template>

    </div>

    <div v-if="selectedPlace" class="modal-backdrop" @click.self="closePlace">
      <section class="place-modal" role="dialog" aria-modal="true" :aria-labelledby="`place-title-${selectedPlace.id}`">
        <button class="modal-close" type="button" aria-label="Close place details" @click="closePlace">×</button>
        <img class="modal-image" :src="selectedPlace.image" :alt="selectedPlace.name" @error="hideBrokenImage" />
        <div class="modal-content">
          <p class="eyebrow">{{ selectedPlace.category }} <span>·</span> {{ selectedPlace.location }}</p>
          <div class="modal-title-row">
            <div>
              <h2 :id="`place-title-${selectedPlace.id}`">{{ selectedPlace.name }}</h2>
              <p class="modal-rating">★ {{ Number(selectedPlace.rating || 0).toFixed(1) }} <span>{{ selectedPlace.reviewCount ? `community rating · ${selectedPlace.reviewCount} ${selectedPlace.reviewCount === 1 ? 'review' : 'reviews'}` : 'curated score · no visitor reviews yet' }}</span></p>
            </div>
            <div class="modal-actions">
              <button class="save-button" :class="{ saved: account.favoriteIds.includes(String(selectedPlace.id)) }" type="button" @click="savePlace(selectedPlace)">
                {{ account.favoriteIds.includes(String(selectedPlace.id)) ? '♥ Saved' : '♡ Save place' }}
              </button>
              <button class="save-button trip-modal-button" type="button" @click="addToTrip(selectedPlace)">＋ Add to trip</button>
            </div>
          </div>
          <p class="modal-description">{{ selectedPlace.description }}</p>
          <div class="place-facts">
            <div><span>GOOD TO KNOW</span><strong>{{ selectedPlace.hours || 'Check with the venue before visiting' }}</strong></div>
            <div><span>ENTRY / PRICE</span><strong>{{ selectedPlace.price || 'Check with the venue' }}</strong></div>
            <div v-if="selectedPlace.address"><span>ADDRESS</span><strong>{{ selectedPlace.address }}</strong></div>
            <div v-if="selectedPlace.phone"><span>CONTACT</span><strong><a :href="'tel:' + selectedPlace.phone.replace(/[^+\d]/g, '')">{{ selectedPlace.phone }}</a></strong></div>
            <div v-if="selectedPlace.website"><span>OFFICIAL WEBSITE</span><strong><a :href="selectedPlace.website" target="_blank" rel="noopener noreferrer">Visit website ↗</a></strong></div>
            <div><span>DETAILS LAST CHECKED</span><strong>{{ selectedPlace.lastVerified || 'Not yet verified by the team' }}</strong></div>
            <div v-if="selectedPlace.bestTime"><span>BEST TIME TO VISIT</span><strong>{{ selectedPlace.bestTime }}</strong></div>
            <div v-if="selectedPlace.tips"><span>VISITOR TIP</span><strong>{{ selectedPlace.tips }}</strong></div>
          </div>
          <p v-if="!selectedPlace.lastVerified" class="verification-note"><span aria-hidden="true">ⓘ</span> Opening hours and prices may change. Confirm details with the venue before travelling.</p>
          <a class="map-link" :href="mapUrl(selectedPlace)" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">⌖</span> Open in Google Maps <span aria-hidden="true">↗</span></a>
          <div class="reviews-section">
            <div class="reviews-heading">
              <div><p class="eyebrow">NOTES FROM VISITORS</p><h3>Leave a little love.</h3></div>
              <span>{{ selectedReviews.length }} {{ selectedReviews.length === 1 ? 'review' : 'reviews' }}</span>
            </div>
            <p v-if="reviewLoading" class="no-reviews">Loading visitor reviews…</p>
            <p v-else-if="reviewLoadError" class="review-error" role="alert">{{ reviewLoadError }}</p>
            <form class="review-form" @submit.prevent="postReview">
              <label>
                <span>Your rating</span>
                <select v-model.number="reviewRating" aria-label="Your rating">
                  <option :value="5">5 — Loved it</option>
                  <option :value="4">4 — Really nice</option>
                  <option :value="3">3 — It was good</option>
                  <option :value="2">2 — Could be better</option>
                  <option :value="1">1 — Not for me</option>
                </select>
              </label>
              <label class="review-message">
                <span>Your review</span>
                <textarea v-model.trim="reviewText" required maxlength="400" rows="3" placeholder="Share a helpful note for the next visitor…"></textarea>
              </label>
              <p v-if="reviewError" class="review-error" role="alert">{{ reviewError }}</p>
              <button class="btn-search review-submit" type="submit">{{ currentUserReview ? 'Update your review' : 'Post your review' }} <span aria-hidden="true">↗</span></button>
              <p class="review-signin-note">
                <template v-if="account.user">Posting as {{ account.user.name }}</template>
                <template v-else>Sign in or create an account to post a review. <button type="button" @click="requestSignIn">Sign in</button></template>
              </p>
            </form>
            <article v-for="review in selectedReviews" :key="review.id" class="review-item">
              <span class="review-avatar">{{ review.name.charAt(0).toUpperCase() }}</span>
              <div>
                <div class="review-byline"><strong>{{ review.name }}</strong><span>★ {{ review.rating }}</span></div>
                <p>{{ review.text }}</p>
                <div class="review-actions">
                  <button class="like-review" :class="{ liked: review.likedByMe }" type="button" :aria-label="review.likedByMe ? 'Unlike this review' : 'Like this review'" @click="likeReview(review)">
                    {{ review.likedByMe ? '♥' : '♡' }} {{ review.likes || 0 }} {{ review.likedByMe ? 'Liked' : 'Like' }}
                  </button>
                  <button v-if="review.isMine" class="delete-review-button" type="button" @click="removeOwnReview(review)">Remove my review</button>
                </div>
              </div>
            </article>
            <p v-if="!reviewLoading && !reviewLoadError && !selectedReviews.length" class="no-reviews">Be the first to share a tip about this place.</p>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PlaceCard from '../components/PlaceCard.vue';
import { account, initializeAccount, loadPlaces, loadReviews, places, placesError, placesLoading, submitReview, toggleFavorite, toggleReviewLike, deleteOwnReview, tripItems, addTripPlace, removeTripPlace, setTripPeriod, moveTripPlace, confirmAction, showToast } from '../state.js';

const route = useRoute();
const router = useRouter();
const categories = [
  { label: 'All places', value: 'All places', icon: '✣', tone: 'tone-green' },
  { label: 'Food & dining', value: 'Food & Dining', icon: '🍴', tone: 'tone-orange' },
  { label: 'Heritage', value: 'Heritage & Culture', icon: '🏛', tone: 'tone-violet' },
  { label: 'Adventure', value: 'Adventure & Nature', icon: '⛰', tone: 'tone-yellow' },
  { label: 'Entertainment', value: 'Entertainment & Leisure', icon: '🎡', tone: 'tone-blue' }
];
const queryInput = ref(String(route.query.q || ''));
const activeCategory = ref(String(route.query.category || 'All places'));
const selectedPlace = ref(null);
const selectedReviews = ref([]);
const reviewText = ref('');
const reviewRating = ref(5);
const reviewError = ref('');
const reviewLoadError = ref('');
const pageError = ref('');
const reviewLoading = ref(false);
const selectedBudget = ref('Any budget');
const minimumRating = ref('Any rating');
const sortBy = ref('Recommended');
const hasFilters = computed(() => Boolean(route.query.q) || (activeCategory.value !== 'All places' && !savedOnly.value) || selectedBudget.value !== 'Any budget' || minimumRating.value !== 'Any rating' || sortBy.value !== 'Recommended');
const currentUserReview = computed(() => selectedReviews.value.find((review) => review.isMine));
const savedOnly = computed(() => route.query.saved === '1' && Boolean(account.user));
const filteredPlaces = computed(() => {
  const query = normalizeText(String(route.query.q || '').trim());
  const result = places.value.filter((place) => {
    const categoryMatch = activeCategory.value === 'All places' || categoryGroup(place.category) === activeCategory.value;
    const searchMatch = !query || [place.name, place.category, place.location, place.address, place.description]
      .filter(Boolean)
      .some((value) => normalizeText(value).includes(query));
    const price = String(place.price || '').toLowerCase();
    const priceSymbols = (price.match(/₱/g) || []).length;
    const free = /free|no cost|no charge|₱0/i.test(price);
    const budgetMatch = selectedBudget.value === 'Any budget'
      || (selectedBudget.value === 'Free' && free)
      || (selectedBudget.value === 'Budget-friendly' && (free || (priceSymbols > 0 && priceSymbols <= 2)))
      || (selectedBudget.value === 'Premium' && (priceSymbols >= 3 || /premium|luxury|high-end/i.test(price)));
    const minRating = minimumRating.value === '4.5+ stars' ? 4.5 : minimumRating.value === '4+ stars' ? 4 : 0;
    const ratingMatch = minRating === 0 || (Number(place.reviewCount || 0) > 0 && Number(place.rating || 0) >= minRating);
    return categoryMatch && searchMatch && budgetMatch && ratingMatch;
  });
  const priceValue = (place) => {
    const text = String(place.price || '').toLowerCase();
    if (/free|no cost|no charge|₱0/.test(text)) return 0;
    const symbols = (text.match(/₱/g) || []).length;
    if (symbols) return symbols;
    return Number.POSITIVE_INFINITY;
  };
  result.sort((a, b) => {
    if (sortBy.value === 'Highest rated') return (Number(b.reviewCount || 0) > 0) - (Number(a.reviewCount || 0) > 0) || Number(b.rating || 0) - Number(a.rating || 0);
    if (sortBy.value === 'Most reviewed') return Number(b.reviewCount || 0) - Number(a.reviewCount || 0) || Number(b.rating || 0) - Number(a.rating || 0);
    if (sortBy.value === 'Most popular') return Number(b.popularity || 0) - Number(a.popularity || 0);
    if (sortBy.value === 'Lowest price') return priceValue(a) - priceValue(b);
    return Number(a.recommendedRank || 999) - Number(b.recommendedRank || 999);
  });
  return result;
});
const savedPlaces = computed(() => places.value.filter((place) => account.favoriteIds.includes(String(place.id))));
const tripPlaces = computed(() => tripItems.value.map((tripItem) => { const place = places.value.find((item) => String(item.id) === String(tripItem.id)); return place ? { ...place, period: tripItem.period } : null; }).filter(Boolean));
const tripDirectionsUrl = computed(() => {
  if (!tripPlaces.value.length) return 'https://www.google.com/maps';
  const stops = tripPlaces.value.map((place) => `${place.name}, ${place.address || place.location || 'Angeles City, Pampanga'}`);
  if (stops.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stops[0])}`;
  const params = new URLSearchParams({ api: '1', origin: stops[0], destination: stops[stops.length - 1], travelmode: 'driving' });
  if (stops.length > 2) params.set('waypoints', stops.slice(1, -1).join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
});
const recommendedPlaces = computed(() => [...places.value].sort((a, b) => Number(a.recommendedRank || 99) - Number(b.recommendedRank || 99)).slice(0, 6));
const hotPlaces = computed(() => [...places.value].sort((a, b) => Number(b.popularity || 0) - Number(a.popularity || 0)).slice(0, 6));
const bestPlaces = computed(() => [...places.value]
  .filter((place) => Number(place.reviewCount || 0) > 0)
  .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(b.reviewCount || 0) - Number(a.reviewCount || 0))
  .slice(0, 6));

const SectionHeading = defineComponent({
  props: { eyebrow: String, title: String, note: String },
  setup(props) {
    return () => h('div', { class: 'section-heading discovery-section-heading' }, [
      h('div', [
        h('p', { class: 'eyebrow' }, props.eyebrow),
        h('h2', props.title),
        h('p', { class: 'section-subtitle' }, props.note)
      ])
    ]);
  }
});

function normalizeText(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function categoryGroup(category = '') {
  const value = category.toLowerCase();
  if (/food|restaurant|dining|cafe/.test(value)) return 'Food & Dining';
  if (/heritage|culture|museum|church/.test(value)) return 'Heritage & Culture';
  if (/adventure|nature|outdoor/.test(value)) return 'Adventure & Nature';
  if (/entertainment|leisure|water|nightlife/.test(value)) return 'Entertainment & Leisure';
  return 'All places';
}

function applySearch() {
  const query = queryInput.value.trim();
  router.replace({ path: '/discover', query: { ...route.query, q: query || undefined } });
}

function chooseCategory(category) {
  activeCategory.value = category;
  router.replace({ path: '/discover', query: { ...route.query, category: category === 'All places' ? undefined : category } });
}

function clearFilters() {
  queryInput.value = '';
  activeCategory.value = 'All places';
  selectedBudget.value = 'Any budget';
  minimumRating.value = 'Any rating';
  sortBy.value = 'Recommended';
  router.replace('/discover');
}

function clearSavedView() {
  router.push('/discover');
}

async function savePlace(place) {
  pageError.value = '';
  if (!account.user) {
    account.authMode = 'login';
    account.showAuth = true;
    return;
  }
  try {
    const wasSaved = account.favoriteIds.includes(String(place.id));
    await toggleFavorite(place.id);
    showToast(wasSaved ? `${place.name} removed from saved places.` : `${place.name} saved to your shortlist.`);
  } catch (error) {
    pageError.value = error.message;
    showToast(error.message, 'error');
  }
}

function addToTrip(place) {
  const added = addTripPlace(place.id);
  if (added) showToast(`${place.name} added to your day plan.`);
  else showToast(`${place.name} is already in your trip.`, 'info');
}

function removeTripItem(place) {
  removeTripPlace(place.id);
  showToast(`${place.name} removed from your day plan.`, 'info');
}

async function clearTrip() {
  const confirmed = await confirmAction({ title: 'Clear your day plan?', message: 'All stops will be removed from this device. This does not affect your saved places.', confirmLabel: 'Clear trip', tone: 'danger' });
  if (!confirmed) return;
  [...tripItems.value].forEach((item) => removeTripPlace(item.id));
  showToast('Your day plan has been cleared.', 'info');
}

function onOpenTrip() {
  showToast('Opening your route in Google Maps.', 'info');
}

function requestSignIn() {
  account.authMode = 'login';
  account.showAuth = true;
}

async function openPlace(place) {
  selectedPlace.value = place;
  selectedReviews.value = [];
  reviewText.value = '';
  reviewRating.value = 5;
  reviewError.value = '';
  reviewLoadError.value = '';
  reviewLoading.value = true;
  try {
    const result = await loadReviews(place.id);
    if (selectedPlace.value?.id === place.id) {
      selectedReviews.value = result.reviews;
      const ownReview = result.reviews.find((review) => review.isMine);
      if (ownReview) {
        reviewText.value = ownReview.text;
        reviewRating.value = ownReview.rating;
      }
    }
  } catch (error) {
    reviewLoadError.value = `Visitor reviews could not be loaded: ${error.message}`;
  } finally {
    reviewLoading.value = false;
  }
}

function closePlace() {
  selectedPlace.value = null;
  selectedReviews.value = [];
}

async function postReview() {
  if (!selectedPlace.value) return;
  reviewError.value = '';
  try {
    const result = await submitReview(selectedPlace.value.id, reviewRating.value, reviewText.value);
    const existingIndex = selectedReviews.value.findIndex((review) => review.id === result.review.id || review.isMine);
    if (existingIndex >= 0) selectedReviews.value.splice(existingIndex, 1, { ...result.review, isMine: true });
    else selectedReviews.value.unshift({ ...result.review, isMine: true });
    reviewText.value = '';
    showToast(existingIndex >= 0 ? 'Your review has been updated.' : 'Thanks for sharing your experience.');
    const updated = places.value.find((place) => String(place.id) === String(selectedPlace.value.id));
    if (updated) {
      updated.rating = result.rating;
      updated.reviewCount = result.reviewCount;
      updated.ratingSource = 'community';
    }
  } catch (error) {
    reviewError.value = error.message;
  }
}

async function removeOwnReview(review) {
  const confirmed = await confirmAction({ title: 'Remove your review?', message: 'Your review and rating will be removed from this place. You can leave a new review later.', confirmLabel: 'Remove review', tone: 'danger' });
  if (!confirmed) return;
  try {
    const result = await deleteOwnReview(review.id);
    selectedReviews.value = selectedReviews.value.filter((item) => item.id !== review.id);
    const updated = places.value.find((place) => String(place.id) === String(result.placeId));
    if (updated) { updated.rating = result.rating; updated.reviewCount = result.reviewCount; updated.ratingSource = result.ratingSource; }
    showToast('Your review was removed.', 'info');
  } catch (error) { reviewError.value = error.message; }
}

async function likeReview(review) {
  reviewError.value = '';
  try {
    const result = await toggleReviewLike(review.id);
    review.likedByMe = result.likedByMe;
    review.likes = result.likes;
  } catch (error) {
    reviewError.value = error.message;
  }
}

function mapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address || place.location || 'Angeles City, Pampanga'}`)}`;
}

function hideBrokenImage(event) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = '/images/destination-placeholder.svg';
  image.alt = `${image.alt || 'Destination'} photo unavailable`;
}

function onEscape(event) {
  if (event.key === 'Escape' && selectedPlace.value) closePlace();
}

watch(() => route.query.q, (query) => { queryInput.value = String(query || ''); });
watch(() => route.query.category, (category) => { activeCategory.value = String(category || 'All places'); });
watch(() => route.query.place, (placeId) => {
  if (!placeId) return;
  const place = places.value.find((item) => String(item.id) === String(placeId));
  if (place) openPlace(place);
});
watch(() => [route.query.saved, account.user], async ([saved, user]) => {
  if (saved === '1' && !user) {
    if (account.token) await initializeAccount();
    if (!account.user) account.showAuth = true;
  }
});

onMounted(async () => {
  if (account.token && !account.user) await initializeAccount();
  if (route.query.saved === '1' && !account.user) account.showAuth = true;
  await loadPlaces();
  if (route.query.place) {
    const place = places.value.find((item) => String(item.id) === String(route.query.place));
    if (place) await openPlace(place);
  }
  window.addEventListener('keydown', onEscape);
});
onUnmounted(() => window.removeEventListener('keydown', onEscape));
</script>
