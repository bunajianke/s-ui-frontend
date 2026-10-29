<template>
  <v-main>
    <div
      class="mn-page-shell"
      :class="{ 'mn-page-shell--wide': route.name === 'pages.clients' }"
    >
      <router-view />
    </div>
  </v-main>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style>
.v-main {
  margin: 10px;
}
</style>
