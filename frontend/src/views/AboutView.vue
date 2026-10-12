<template>
  <main class="about-page">
    <section class="page-hero about-hero">
      <p class="eyebrow">A GOOD PLACE TO GET LOST</p>
      <h1>Meet Angeles.<br /><em>Stay a little.</em></h1>
      <p>A city shaped by its stories, its generous table, and the people who call it home.</p>
    </section>
    <section class="about-story">
      <div class="about-story-copy">
        <p class="eyebrow">MORE THAN A STOP ON THE WAY</p>
        <h2>There's a lot to<br /><em>love around here.</em></h2>
        <p>Angeles City is the kind of place best explored one small discovery at a time. Follow the old streets around the Heritage District, linger over Kapampangan food, and make a day of the wide-open spaces and family attractions nearby.</p>
        <p>Angeles Discovery is a local-minded guide to getting out there. We bring notable landmarks, much-loved neighborhood spots, and useful visitor details into one easy place to explore.</p>
        <RouterLink class="solid-link" to="/discover">Find your next stop <span aria-hidden="true">↗</span></RouterLink>
      </div>
      <div class="about-photo about-photo-one" role="img" aria-label="Angeles City and its surroundings"></div>
    </section>
    <section class="about-pillars">
      <article><span class="pillar-icon tone-orange">🍲</span><h3>Good things to eat</h3><p>Discover the flavors and local favorites that make Pampanga famous for its table.</p></article>
      <article><span class="pillar-icon tone-violet">🏛</span><h3>Stories in every street</h3><p>Explore heritage landmarks, museums, and the history woven through the city.</p></article>
      <article><span class="pillar-icon tone-green">🌿</span><h3>Room to explore</h3><p>Find day trips, family fun, and nearby adventures around Angeles and Clark.</p></article>
    </section>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
