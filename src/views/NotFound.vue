<!-- src/views/NotFound.vue -->
<template>
  <div class="not-found">
    <div class="container">
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <router-link to="/" class="btn btn-primary">Go Home</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404 page logic
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  padding: 4rem 2rem;
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  background: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-top: 2rem;
  transition: background-color 0.2s ease;
}

.btn:hover {
  background: #0056b3;
}
</style>