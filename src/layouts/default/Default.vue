<template>
  <v-app style="overflow: auto;">
    <drawer
      :is-mobile="isMobile"
      :display-drawer="displayDrawer"
      @toggle-drawer="toggleDrawer"
    />
    <default-bar
      :is-mobile="isMobile"
      @toggle-drawer="toggleDrawer"
    />
    <default-view />
    <nav
      v-if="isMobile"
      class="mn-mobile-nav"
      :aria-label="$t('magicnet.navigation')"
    >
      <router-link to="/">
        <v-icon
          icon="mdi-home-outline"
          size="23"
        />{{ $t('pages.home') }}
      </router-link>
      <router-link to="/clients">
        <v-icon
          icon="mdi-account-multiple-outline"
          size="23"
        />{{ $t('pages.clients') }}
      </router-link>
    </nav>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import DefaultBar from './AppBar.vue'
import Drawer from './Drawer.vue'
import DefaultView from './View.vue'
import { useDisplay } from 'vuetify'

const { smAndDown } = useDisplay()
const displayDrawer = ref(false)

const toggleDrawer = () => {
  displayDrawer.value = !displayDrawer.value
}

const isMobile = computed((): boolean => smAndDown.value)

// keep the drawer open on desktop and closed on mobile
watch(smAndDown, (v) => { displayDrawer.value = !v }, { immediate: true })
</script>

<style>
.v-card-subtitle {
  text-align: center;
  border-bottom: 1px solid gray;
  min-height: 20px;
}
.v-switch.v-input {
  padding-inline-start: .6rem;
}
</style>
