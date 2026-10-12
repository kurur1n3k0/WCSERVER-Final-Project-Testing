<template>
  <article class="place-card">
    <button class="card-open" type="button" :aria-label="`View details for ${place.name}`" @click="$emit('select', place)">
      <div class="card-image-wrap">
        <img :src="place.image" :alt="place.name" class="card-img" loading="lazy" @error="hideBrokenImage" />
        <span class="card-category">{{ categoryLabel }}</span>
      </div>
      <div class="card-content">
        <div class="card-title-row">
          <h3>{{ place.name }}</h3>
          <span class="card-rating">
            <span aria-hidden="true">★</span> {{ Number(rating).toFixed(1) }}
            <small>{{ place.reviewCount ? `${place.reviewCount} ${place.reviewCount === 1 ? 'review' : 'reviews'}` : 'Curated score' }}</small>
          </span>
        </div>
        <p class="card-location"><span aria-hidden="true">⌖</span> {{ place.location || 'Angeles City, Pampanga' }}</p>
        <div class="card-footer">
          <span>{{ place.price || 'See details for pricing' }}</span>
          <span class="card-more">Discover <span aria-hidden="true">↗</span></span>
        </div>
      </div>
    </button>
    <button class="trip-add-button" type="button" :aria-label="`Add ${place.name} to my trip`" @click="$emit('add-to-trip', place)">
      <span aria-hidden="true">＋</span> Trip
    </button>
    <button
      class="favorite-button"
      :class="{ saved }"
      type="button"
      :aria-label="saved ? `Remove ${place.name} from saved places` : `Save ${place.name}`"
      :aria-pressed="saved"
      @click="$emit('toggle-save', place)"
    >{{ saved ? '♥' : '♡' }}</button>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  place: { type: Object, required: true },
  rating: { type: Number, default: 0 },
  saved: { type: Boolean, default: false }
});

defineEmits(['select', 'toggle-save', 'add-to-trip']);

function hideBrokenImage(event) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = '/images/destination-placeholder.svg';
  image.alt = `${props.place.name} photo unavailable`;
}

const categoryLabel = computed(() => {
  const value = (props.place.category || '').toLowerCase();
  if (/food|restaurant|dining|cafe/.test(value)) return 'Food & Dining';
  if (/heritage|culture|museum|church/.test(value)) return 'Heritage & Culture';
  if (/adventure|nature|outdoor/.test(value)) return 'Adventure & Nature';
  if (/entertainment|leisure|water|nightlife/.test(value)) return 'Entertainment & Leisure';
  return props.place.category || 'Local favorite';
});
</script>
