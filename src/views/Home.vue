<template>
  <MagicNetOverview />
  <v-expansion-panels
    class="mn-advanced"
    variant="accordion"
  >
    <v-expansion-panel :title="$t('magicnet.advancedMonitoring')">
      <v-expansion-panel-text><Main /></v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts" setup>
  import Main from '@/components/Main.vue'
  import MagicNetOverview from '@/components/MagicNetOverview.vue'
</script>
