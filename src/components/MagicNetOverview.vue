<template>
  <section
    class="mn-overview"
    :aria-busy="loading"
  >
    <header class="mn-page-heading">
      <div>
        <h1>{{ $t('magicnet.overview') }}</h1>
        <span
          class="mn-service-state"
          :class="status.sbd?.running ? 'is-online' : 'is-offline'"
        >
          <v-icon
            :icon="status.sbd?.running ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'"
            size="18"
          />
          {{ loading ? $t('loading') : status.sbd?.running ? $t('magicnet.running') : $t('magicnet.stopped') }}
        </span>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        to="/clients?add=1"
      >
        {{ $t('magicnet.addUser') }}
      </v-btn>
    </header>

    <v-alert
      v-if="error"
      type="warning"
      variant="tonal"
      class="mb-6"
    >
      {{ $t('magicnet.loadFailed') }}
      <v-btn
        variant="text"
        @click="reload"
      >
        {{ $t('actions.update') }}
      </v-btn>
    </v-alert>

    <section
      class="mn-surface mn-overview-totals"
      :aria-label="$t('magicnet.accounts')"
    >
      <div><span>{{ $t('magicnet.accounts') }}</span><strong>{{ clients.length }}</strong></div>
      <div><span>{{ $t('online') }}</span><strong>{{ onlineCount }}</strong></div>
      <div><span>{{ $t('magicnet.accountUsage') }}</span><strong>{{ size(used) }}</strong></div>
    </section>

    <div class="mn-overview-columns">
      <section class="mn-surface mn-usage-list">
        <header class="mn-section-heading">
          <h2>{{ $t('magicnet.userTraffic') }}</h2>
          <v-btn
            variant="text"
            size="small"
            to="/clients"
            append-icon="mdi-arrow-right"
          >
            {{ $t('all') }}
          </v-btn>
        </header>
        <p
          v-if="!clients.length"
          class="mn-empty"
        >
          {{ $t('magicnet.noUsers') }}
        </p>
        <router-link
          v-for="client in busiest"
          :key="client.id"
          class="mn-usage-row"
          to="/clients"
        >
          <div class="mn-user-identity">
            <span class="mn-avatar">{{ label(client).slice(0, 1).toUpperCase() }}</span>
            <div><strong>{{ label(client) }}</strong><span v-if="client.group">{{ client.group }}</span></div>
          </div>
          <div class="mn-usage-value">
            <strong>{{ size(client.up + client.down) }}</strong>
            <span>{{ client.volume ? '/ ' + size(client.volume) : $t('unlimited') }}</span>
          </div>
        </router-link>
      </section>

      <section class="mn-surface mn-system-summary">
        <header class="mn-section-heading">
          <h2>{{ $t('main.info.sys') }}</h2>
        </header>
        <dl>
          <div><dt>CPU</dt><dd>{{ status.cpu == null ? '—' : Math.round(status.cpu) + '%' }}</dd></div>
          <div><dt>{{ $t('main.info.memory') }}</dt><dd>{{ status.mem ? size(status.mem.current) + ' / ' + size(status.mem.total) : '—' }}</dd></div>
          <div><dt>{{ $t('main.gauge.dsk') }}</dt><dd>{{ status.dsk ? size(status.dsk.current) + ' / ' + size(status.dsk.total) : '—' }}</dd></div>
          <div><dt>{{ $t('pages.inbounds') }}</dt><dd>{{ Data().inbounds.length }}</dd></div>
          <div><dt>S-UI</dt><dd>{{ status.sys?.appVersion ? 'v' + status.sys.appVersion : '—' }}</dd></div>
        </dl>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Data from '@/store/modules/data'
import HttpUtils from '@/plugins/httputil'
import { HumanReadable } from '@/plugins/utils'
import type { Client } from '@/types/clients'

type Resource = { current: number; total: number }
type Status = { cpu?: number; mem?: Resource; dsk?: Resource; sys?: { appVersion: string }; sbd?: { running: boolean } }
const status = ref<Status>({})
const loading = ref(true)
const error = ref(false)
const clients = computed(() => Data().clients)
const busiest = computed(() => [...clients.value].sort((a, b) => (b.up + b.down) - (a.up + a.down)).slice(0, 6))
const used = computed(() => clients.value.reduce((sum, client) => sum + client.up + client.down, 0))
const onlineCount = computed(() => Data().onlines.user?.length ?? 0)
const label = (client: Client) => client.remark || client.desc || client.name
const size = (value: number) => value === 0 ? '0 B' : HumanReadable.sizeFormat(value)
let timer: ReturnType<typeof setInterval> | undefined
let pending = false
let stopped = false
async function reload() {
  if (pending || stopped) return
  pending = true
  try {
    const response = await HttpUtils.get<Status>('api/status', { r: 'cpu,mem,dsk,sys,sbd' })
    if (stopped) return
    error.value = !response.success
    if (response.success) status.value = response.obj
  } finally {
    loading.value = false
    pending = false
  }
}
onMounted(() => {
  reload()
  timer = setInterval(() => { if (!document.hidden) reload() }, 10000)
})
onBeforeUnmount(() => { stopped = true; clearInterval(timer) })
</script>
