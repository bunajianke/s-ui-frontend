<template>
  <v-dialog
    class="mn-editor-dialog"
    transition="dialog-bottom-transition"
    width="460"
  >
    <v-card
      id="qrcode-modal"
      :loading="loading"
    >
      <v-card-title>
        {{ $t('setting.sub') }}
        <v-btn
          class="float-right"
          icon="mdi-close"
          variant="text"
          :aria-label="$t('actions.close')"
          @click="$emit('close')"
        />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-skeleton-loader
          v-if="loading"
          type="image, text"
        />
        <v-alert
          v-else-if="failed"
          type="warning"
          variant="tonal"
        >
          {{ $t('magicnet.loadFailed') }}
        </v-alert>
        <template v-else>
          <div class="mn-subscription-controls">
            <h2 class="mn-client-name">
              {{ client.remark || client.desc || client.name }}
            </h2>
            <v-select
              v-model="format"
              :items="formats"
              :label="$t('magicnet.clientApp')"
              hide-details
              class="mt-5"
            />
          </div>
          <div class="mn-qr-container">
            <QrcodeVue
              :value="subscription"
              :size="280"
              :margin="3"
              render-as="svg"
            />
            <p
              class="mn-subscription-link"
              dir="ltr"
            >
              {{ subscription }}
            </p>
          </div>
          <v-expansion-panels variant="accordion">
            <v-expansion-panel :title="$t('client.links')">
              <v-expansion-panel-text>
                <div
                  v-for="(link, index) in client.links || []"
                  :key="index"
                  class="mb-4"
                >
                  <p>{{ link.remark || link.type }}</p>
                  <v-btn
                    variant="tonal"
                    block
                    prepend-icon="mdi-content-copy"
                    @click="copy(link.uri)"
                  >
                    {{ $t('copyToClipboard') }}
                  </v-btn>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          variant="flat"
          block
          prepend-icon="mdi-content-copy"
          :disabled="loading || failed"
          @click="copy(subscription)"
        >
          {{ $t('magicnet.copySubscription') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import Clipboard from 'clipboard'
import { push } from 'notivue'
import { i18n } from '@/locales'
import Data from '@/store/modules/data'
import type { Client } from '@/types/clients'
const props = defineProps<{ id: number; visible: boolean }>()
defineEmits<{ close: [] }>()
const client = ref<Client>({} as Client)
const loading = ref(false)
const failed = ref(false)
const format = ref('shadowrocket')
let generation = 0
const bridge = computed(() => Data().subURI.includes('/subscribe-'))
const formats = computed(() => bridge.value ? [
  { title: 'Shadowrocket', value: 'shadowrocket' },
  { title: 'Clash / Mihomo', value: 'clash' },
  { title: 'Surge', value: 'surge-config' },
  { title: i18n.global.t('magicnet.shadowrocketRules'), value: 'shadowrocket-config' },
] : [
  { title: i18n.global.t('setting.sub'), value: 'shadowrocket' },
  { title: 'Clash / Mihomo', value: 'clash' },
  { title: 'sing-box JSON', value: 'json' },
])
const subscription = computed(() => {
  const base = Data().subURI + encodeURIComponent(client.value.name || '')
  if (!bridge.value) return base + (format.value === 'shadowrocket' ? '' : '?format=' + format.value)
  const file = format.value === 'shadowrocket' ? '/MagicNet.txt' : format.value === 'shadowrocket-config' ? '/MagicNet.yaml' : '/MagicNet'
  return base + file + '?format=' + format.value
})
watch(() => props.visible, async visible => {
  const request = ++generation
  if (!visible) return
  loading.value = true
  failed.value = false
  format.value = 'shadowrocket'
  const result = await Data().loadClients(props.id)
  if (request !== generation) return
  client.value = result
  failed.value = !result?.id
  loading.value = false
}, { immediate: true })
async function copy(value: string) {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value)
      push.success({ message: i18n.global.t('copyToClipboard') })
      return
    } catch {
      // Keep older Safari and HTTP installations usable through the legacy path.
    }
  }
  const button = document.createElement('button')
  button.className = 'mn-clipboard-trigger'
  button.hidden = true
  document.body.appendChild(button)
  const clipboard = new Clipboard(button, { text: () => value, container: document.getElementById('qrcode-modal') || undefined })
  clipboard.on('success', () => { clipboard.destroy(); push.success({ message: i18n.global.t('copyToClipboard') }) })
  clipboard.on('error', () => { clipboard.destroy(); push.error({ message: i18n.global.t('failed') + ': ' + i18n.global.t('copyToClipboard') }) })
  button.click()
  button.remove()
}
</script>
