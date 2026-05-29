<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
}

const hydrated = ref(false)
const installed = ref(false)
const installBusy = ref(false)
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)

const canInstall = computed(() => !installed.value && !!deferredPrompt.value)

const detectInstalled = () => {
  if (!import.meta.client) {
    return false
  }

  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches
  const standaloneIOS = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  return standaloneMedia || standaloneIOS
}

const install = async () => {
  if (!deferredPrompt.value || installBusy.value) {
    return
  }

  installBusy.value = true

  try {
    await deferredPrompt.value.prompt()
    const choice = await deferredPrompt.value.userChoice

    if (choice.outcome === 'accepted') {
      installed.value = true
      deferredPrompt.value = null
    }
  } finally {
    installBusy.value = false
  }
}

onMounted(() => {
  hydrated.value = true
  installed.value = detectInstalled()

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
  })

  window.addEventListener('appinstalled', () => {
    installed.value = true
    deferredPrompt.value = null
  })
})
</script>

<template>
  <div v-if="hydrated && canInstall" class="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-lg bg-[#3B82F6] p-4 text-white">
      <p class="text-sm font-semibold uppercase tracking-[0.16em]">
        Install Keep Track
      </p>

      <button
        class="btn-flat focus-solid h-11 bg-white px-4 text-xs uppercase tracking-[0.2em] text-[#2563EB]"
        @click="install"
      >
        {{ installBusy ? 'Opening...' : 'Install App' }}
      </button>
    </div>
  </div>
</template>
