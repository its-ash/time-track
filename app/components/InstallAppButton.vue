<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
}

const hydrated = ref(false)
const installed = ref(false)
const installBusy = ref(false)
const showGuide = ref(false)
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const isIOS = ref(false)

const shouldShow = computed(() => hydrated.value && !installed.value)

const actionLabel = computed(() => {
  if (deferredPrompt.value) {
    return installBusy.value ? 'Opening...' : 'Install App'
  }
  return 'How to Install'
})

const detectInstalled = () => {
  if (!import.meta.client) return false
  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches
  const standaloneIOS = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  return standaloneMedia || standaloneIOS
}

const install = async () => {
  if (installBusy.value) return

  if (!deferredPrompt.value) {
    showGuide.value = true
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
  isIOS.value = /iphone|ipad|ipod/i.test(window.navigator.userAgent)

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
  })

  window.addEventListener('appinstalled', () => {
    installed.value = true
    deferredPrompt.value = null
    showGuide.value = false
  })
})
</script>

<template>
  <div v-if="shouldShow" class="w-full flex justify-center">
    <div class="flex items-center justify-between gap-3 rounded-2xl bg-[#3B82F6] p-4 text-white shadow-xl mb-4">
      <p class="text-sm font-semibold uppercase tracking-[0.16em]">
        Install Keep Track
      </p>
      <button
        class="btn-flat focus-solid h-11 bg-white px-4 text-xs uppercase tracking-[0.2em] text-[#2563EB]"
        @click="install"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="showGuide"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      @click.self="showGuide = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-extrabold text-[#111827]">Install Keep Track</h3>
          <button
            class="btn-flat focus-solid flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-lg text-[#6B7280]"
            @click="showGuide = false"
          >
            ✕
          </button>
        </div>

        <template v-if="isIOS">
          <ol class="space-y-3 text-sm text-[#374151]">
            <li class="flex items-start gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white">1</span>
              Tap the <strong>Share</strong> button at the bottom of Safari (the box with an arrow).
            </li>
            <li class="flex items-start gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white">2</span>
              Scroll down and tap <strong>Add to Home Screen</strong>.
            </li>
            <li class="flex items-start gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white">3</span>
              Tap <strong>Add</strong> in the top right corner.
            </li>
          </ol>
        </template>

        <template v-else>
          <ol class="space-y-3 text-sm text-[#374151]">
            <li class="flex items-start gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white">1</span>
              Open this page in <strong>Chrome</strong> or <strong>Edge</strong> on your device.
            </li>
            <li class="flex items-start gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white">2</span>
              Tap the <strong>⋮ menu</strong> (three dots) in the top-right corner.
            </li>
            <li class="flex items-start gap-3">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-xs font-bold text-white">3</span>
              Tap <strong>Install app</strong> or <strong>Add to Home Screen</strong>.
            </li>
          </ol>
        </template>

        <p class="mt-4 text-xs text-[#9CA3AF]">
          Once installed, Keep Track runs like a native app — no browser bar, works offline.
        </p>
      </div>
    </div>
  </Teleport>
</template>
