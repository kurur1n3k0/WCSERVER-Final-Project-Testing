<template>
  <main class="contact-page">
    <section class="contact-intro page-hero">
      <p class="eyebrow">WE'RE ALL EARS</p>
      <h1>Help us make<br /><em>Angeles better.</em></h1>
      <p>Know a spot we should feature? Have an idea that would make this guide more useful? Send it our way.</p>
    </section>
    <section class="contact-layout">
      <div class="contact-aside">
        <span class="contact-mark">✳</span>
        <h2>Local knowledge<br />makes a good guide.</h2>
        <p>Your suggestions help fellow visitors find places worth caring about. Share a new attraction, a detail we should fix, or an idea for the site.</p>
        <p class="contact-promise">Every thoughtful tip helps someone have a better day out.</p>
      </div>
      <form class="contact-form" @submit.prevent="sendSuggestion">
        <div v-if="submitted" class="form-success" role="status">
          <span>✓</span>
          <strong>Thanks for helping out!</strong>
          <p>Your suggestion is on its way to our team.</p>
          <button type="button" @click="resetForm">Send another suggestion</button>
        </div>
        <template v-else>
          <h2>Send us a note</h2>
          <p class="form-intro">No account needed. Just a few details and your idea.</p>
          <label class="honeypot" aria-hidden="true">Website<input v-model="website" tabindex="-1" autocomplete="off" /></label>
          <label>
            <span>Your name <small>optional</small></span>
            <input v-model.trim="form.name" maxlength="60" autocomplete="name" placeholder="What should we call you?" />
          </label>
          <label>
            <span>Email <small>optional</small></span>
            <input v-model.trim="form.email" type="email" maxlength="254" autocomplete="email" placeholder="you@example.com" />
          </label>
          <label>
            <span>What's this about?</span>
            <select v-model="form.topic" required>
              <option value="" disabled>Choose a topic</option>
              <option value="Suggest a place">Suggest a place</option>
              <option value="Correct a detail">Correct a detail</option>
              <option value="Share an idea">Share an idea</option>
              <option value="Something else">Something else</option>
            </select>
          </label>
          <label>
            <span>Your suggestion</span>
            <textarea v-model.trim="form.message" required minlength="10" maxlength="1500" rows="5" placeholder="Tell us what you have in mind…"></textarea>
          </label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="primary-button" type="submit" :disabled="busy">{{ busy ? 'Sending…' : 'Send suggestion' }} <span aria-hidden="true">↗</span></button>
        </template>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { submitSuggestion } from '../state.js';

const form = reactive({ name: '', email: '', topic: '', message: '' });
const website = ref('');
const error = ref('');
const submitted = ref(false);
const busy = ref(false);

async function sendSuggestion() {
  busy.value = true;
  error.value = '';
  try {
    await submitSuggestion({ ...form, website: website.value });
    submitted.value = true;
  } catch (requestError) {
    error.value = requestError.message || 'Your suggestion could not be sent. Please try again.';
  } finally {
    busy.value = false;
  }
}

function resetForm() {
  Object.assign(form, { name: '', email: '', topic: '', message: '' });
  website.value = '';
  submitted.value = false;
}
</script>
