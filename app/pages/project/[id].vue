<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const route = useRoute()
const projectId = computed(() => String(route.params.id || ''))
const store = useTimeStore()

const project = computed(() => store.getProject(projectId.value))
const note = ref('')
const minutes = ref(20)
const exportBusy = ref(false)
const hydrated = ref(false)
const paymentMode = ref<'all' | 'custom'>('all')
const customMinutes = ref(20)

const totalMinutes = computed(() => {
  if (!project.value) {
    return 0
  }

  return project.value.logs.reduce((sum, log) => sum + log.minutes, 0)
})

const totalHours = computed(() => (totalMinutes.value / 60).toFixed(2))

const hourOptions = computed(() => {
  const values: number[] = []

  for (let value = 20; value <= totalMinutes.value; value += 20) {
    values.push(value)
  }

  return values
})

watch(hourOptions, (value) => {
  if (!value.includes(customMinutes.value)) {
    customMinutes.value = value[0] || 20
  }
}, { immediate: true })

const toHours = (m: number) => (m / 60).toFixed(2)
const formatDate = (iso: string) => new Date(iso).toLocaleString()

const addLog = () => {
  if (!project.value) {
    return
  }

  const added = store.addLog(project.value.id, note.value, minutes.value)

  if (added) {
    note.value = ''
    minutes.value = 20
  }
}

const payDone = () => {
  if (!project.value || totalMinutes.value === 0) {
    return
  }

  const minutesToPay = paymentMode.value === 'all' ? totalMinutes.value : customMinutes.value
  const paid = store.markPaymentDone(project.value.id, paymentMode.value, minutesToPay)

  if (!paid) {
    alert('Payment failed. Ensure selected hours match available log blocks.')
    return
  }

  alert(`Payment recorded for ${toHours(paid.paidMinutes)} hours.`)
}

const exportProjectPdf = async () => {
  if (!project.value || exportBusy.value) {
    return
  }

  exportBusy.value = true

  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const marginX = 44
    const pageHeight = doc.internal.pageSize.getHeight()
    let y = 52

    const ensureRoom = (size = 28) => {
      if (y + size < pageHeight - 50) {
        return
      }
      doc.addPage()
      y = 52
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(`${project.value.name} - Time Log Export`, marginX, y)
    y += 24

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y)
    y += 18
    doc.text(`Total Active Hours: ${toHours(totalMinutes.value)}`, marginX, y)
    y += 24

    if (project.value.logs.length === 0) {
      doc.setFontSize(12)
      doc.text('No active logs available.', marginX, y)
      doc.save(`${project.value.name.toLowerCase().replaceAll(' ', '-')}-time-log.pdf`)
      return
    }

    for (const log of [...project.value.logs].reverse()) {
      ensureRoom(40)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(log.note, marginX, y)
      y += 14

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      const line = `${log.minutes} min (${toHours(log.minutes)} h) - ${formatDate(log.createdAt)}`
      const lines = doc.splitTextToSize(line, 500)

      for (const wrapped of lines) {
        ensureRoom(20)
        doc.text(wrapped, marginX, y)
        y += 14
      }

      y += 8
    }

    doc.save(`${project.value.name.toLowerCase().replaceAll(' ', '-')}-time-log.pdf`)
  } finally {
    exportBusy.value = false
  }
}

const clearProjectLogs = () => {
  if (!project.value) {
    return
  }

  const ok = confirm(`Clear all active logs for ${project.value.name}?`)

  if (ok) {
    store.clearProjectLogs(project.value.id)
  }
}

onMounted(() => {
  hydrated.value = true
})
</script>

<template>
  <main class="page-shell mobile-native-shell">
    <section class="relative overflow-hidden bg-[#111827] px-6 py-12 text-white md:py-16">
      <div class="poster-shape -top-15 right-[5%] h-40 w-40 rotate-12 bg-white/10" />
      <div class="poster-shape -bottom-12.5 left-[8%] h-28 w-28 rounded-full bg-white/10" />

      <div class="mx-auto max-w-7xl">
        <NuxtLink
          to="/"
          class="mb-5 inline-flex h-12 items-center justify-center rounded-md border-4 border-white px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all duration-200 hover:scale-105 hover:bg-white hover:text-[#111827] focus-solid"
        >
          Back to Home
        </NuxtLink>

        <h1 v-if="!hydrated" class="text-4xl font-extrabold leading-tight md:text-6xl">
          Project
        </h1>
        <h1 v-else-if="project" class="text-4xl font-extrabold leading-tight md:text-6xl">
          {{ project.name }}
        </h1>
        <h1 v-else class="text-4xl font-extrabold leading-tight md:text-6xl">
          Project Not Found
        </h1>
      </div>
    </section>

    <section v-if="hydrated && project" class="bg-white px-6 py-8 md:py-12">
      <div class="mx-auto grid max-w-7xl gap-5 md:grid-cols-12">
        <article class="card-flat rounded-lg bg-[#F3F4F6] p-6 md:col-span-8 md:p-8">
          <h2 class="text-2xl font-extrabold text-[#111827] md:text-3xl">Add Time Log</h2>

          <form class="mt-5 grid gap-3 md:grid-cols-12" @submit.prevent="addLog">
            <input
              v-model="note"
              class="input-flat focus-solid h-14 px-4 text-base md:col-span-7"
              placeholder="DB Sync fixed"
              required
            >

            <div class="grid h-14 grid-cols-3 rounded-md bg-[#E5E7EB] p-1 md:col-span-3">
              <button
                type="button"
                class="btn-flat focus-solid bg-white text-lg font-bold text-[#111827]"
                @click="minutes = Math.max(20, minutes - 20)"
              >
                -
              </button>
              <div class="flex items-center justify-center text-sm font-bold text-[#111827]">
                {{ minutes }} min
              </div>
              <button
                type="button"
                class="btn-flat focus-solid bg-white text-lg font-bold text-[#111827]"
                @click="minutes += 20"
              >
                +
              </button>
            </div>

            <button class="btn-flat focus-solid h-14 bg-[#3B82F6] px-4 text-sm uppercase tracking-[0.2em] text-white hover:bg-[#2563EB] md:col-span-2">
              Add
            </button>
          </form>
        </article>

        <article class="card-flat rounded-lg bg-[#10B981] p-6 text-white md:col-span-4 md:p-8">
          <p class="text-xs uppercase tracking-[0.2em] text-white/80">Current Active Time</p>
          <p class="mt-2 text-4xl font-extrabold">{{ totalHours }} h</p>
          <p class="mt-1 text-sm text-white/90">{{ totalMinutes }} minutes</p>
        </article>
      </div>
    </section>

    <section v-if="hydrated && project" class="bg-[#F3F4F6] px-6 py-8 md:py-12">
      <div class="mx-auto max-w-7xl">
        <div class="mb-4 flex items-center justify-between gap-4">
          <h2 class="text-3xl font-extrabold text-[#111827]">Time Logs</h2>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">Newest first</p>
        </div>

        <div v-if="project.logs.length === 0" class="rounded-lg bg-white p-8 text-center text-[#4B5563]">
          No logs yet. Add your first entry above.
        </div>

        <div v-else class="project-log-list grid gap-3">
          <article
            v-for="log in project.logs"
            :key="log.id"
            class="card-flat grid items-center gap-3 rounded-lg bg-white p-4 md:grid-cols-12 md:p-5"
          >
            <div class="md:col-span-6">
              <p class="text-lg font-semibold text-[#111827]">{{ log.note }}: {{ log.minutes }} min</p>
              <p class="mt-1 text-xs uppercase tracking-[0.18em] text-[#6B7280]">{{ formatDate(log.createdAt) }}</p>
            </div>
            <p class="text-xl font-extrabold text-[#3B82F6] md:col-span-2">{{ toHours(log.minutes) }} h</p>
            <div class="md:col-span-4 md:text-right">
              <button
                class="btn-flat focus-solid h-12 bg-[#F59E0B] px-4 text-xs uppercase tracking-[0.2em] text-white hover:bg-[#D97706]"
                @click="store.removeLog(project.id, log.id)"
              >
                Remove Log
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section v-if="hydrated && project" class="bg-[#F59E0B] px-6 py-10 text-white md:py-14">
      <div class="mx-auto max-w-7xl rounded-lg bg-black/10 p-6 md:p-8">
        <h2 class="text-3xl font-extrabold md:text-4xl">Payment Done</h2>
        <p class="mt-2 max-w-3xl text-sm text-white/90 md:text-base">
          Choose how many hours to clear from active logs after payment is completed.
        </p>

        <div class="mt-6 grid gap-4 md:grid-cols-12 md:items-end">
          <div class="md:col-span-4">
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">How much hours</p>
            <div class="grid grid-cols-2 gap-2 rounded-md bg-white/20 p-1">
              <button
                class="btn-flat focus-solid h-12 text-xs uppercase tracking-[0.2em]"
                :class="paymentMode === 'all' ? 'bg-white text-[#D97706]' : 'bg-transparent text-white'"
                @click="paymentMode = 'all'"
              >
                Select All
              </button>
              <button
                class="btn-flat focus-solid h-12 text-xs uppercase tracking-[0.2em]"
                :class="paymentMode === 'custom' ? 'bg-white text-[#D97706]' : 'bg-transparent text-white'"
                @click="paymentMode = 'custom'"
              >
                Custom
              </button>
            </div>
          </div>

          <div class="md:col-span-4">
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Hours to clear</p>
            <select
              v-model.number="customMinutes"
              class="input-flat focus-solid h-12 w-full bg-white px-3 text-sm text-[#111827]"
              :disabled="paymentMode !== 'custom'"
            >
              <option v-for="option in hourOptions" :key="option" :value="option">
                {{ toHours(option) }} h ({{ option }} min)
              </option>
            </select>
          </div>

          <div class="md:col-span-4 md:text-right">
            <button
              class="btn-flat focus-solid h-14 w-full bg-[#111827] px-6 text-sm uppercase tracking-[0.24em] text-white hover:bg-black md:w-auto"
              @click="payDone"
            >
              Confirm Payment Done
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="hydrated && project" class="bg-[#111827] px-4 pt-6 text-white md:px-6 md:py-12">
      <div class="native-bottom-actions mx-auto max-w-7xl rounded-t-lg bg-white/10 p-5 md:rounded-lg md:p-8">
        <h2 class="text-2xl font-extrabold md:text-3xl">Project Actions</h2>
        <p class="mt-2 text-sm text-white/80 md:text-base">
          Export or clear logs for this project only.
        </p>

        <div class="mt-6 grid gap-3 md:grid-cols-2">
          <button
            class="btn-flat focus-solid h-14 bg-[#3B82F6] px-6 text-sm uppercase tracking-[0.2em] text-white hover:bg-[#2563EB]"
            @click="exportProjectPdf"
          >
            {{ exportBusy ? 'Exporting...' : 'Export Project PDF' }}
          </button>
          <button
            class="btn-flat focus-solid h-14 bg-[#F59E0B] px-6 text-sm uppercase tracking-[0.2em] text-white hover:bg-[#D97706]"
            @click="clearProjectLogs"
          >
            Clear Project Logs
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
