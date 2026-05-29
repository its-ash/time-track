<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

const store = useTimeStore()
const projectName = ref('')
const hydrated = ref(false)

const projects = computed(() => store.projects.value)
const totalHours = computed(() => (store.totalActiveMinutes.value / 60).toFixed(2))
const totalLogs = computed(() => {
  return projects.value.reduce((sum, project) => sum + project.logs.length, 0)
})

const toHours = (minutes: number) => {
  return (minutes / 60).toFixed(2)
}

const addProject = () => {
  const project = store.addProject(projectName.value)

  if (!project) {
    return
  }

  projectName.value = ''
  navigateTo(`/project/${project.id}`)
}

onMounted(() => {
  hydrated.value = true
})
</script>

<template>
  <main class="page-shell mobile-native-shell">




    <section v-if="hydrated" class="bg-[#F3F4F6] px-6 py-10 md:py-14">
      <div class="mx-auto max-w-7xl">
        <div class="mb-6 flex items-center justify-between gap-4">
          <h2 class="text-3xl font-extrabold text-[#111827] md:text-4xl">
            Your Projects
          </h2>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280]">
            Click to open and log time
          </p>
        </div>

        <div v-if="projects.length === 0" class="rounded-lg bg-white p-8 text-center text-[#4B5563]">
          No projects yet. Create one above to start logging.
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink v-for="project in projects" :key="project.id" :to="`/project/${project.id}`"
            class="card-flat group rounded-lg bg-white p-6 no-underline">
            <div
              class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3B82F6] text-2xl font-extrabold text-white transition-transform duration-200 group-hover:scale-110">
              {{ project.name.slice(0, 1).toUpperCase() }}
            </div>
            <h3 class="text-2xl font-bold text-[#111827]">{{ project.name }}</h3>
            <p class="mt-2 text-sm text-[#4B5563]">
              {{ project.logs.length }} logs · {{toHours(project.logs.reduce((sum, log) => sum + log.minutes, 0))}} h
            </p>
            <p class="mt-4 text-xs uppercase tracking-[0.2em] text-[#2563EB]">Open Project</p>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section v-else class="bg-[#F3F4F6] px-6 py-10 md:py-14">
      <div class="mx-auto max-w-7xl rounded-lg bg-white p-8 text-center text-[#4B5563]">
        Loading projects...
      </div>
    </section>
    <section v-if="hydrated" class="bg-[#10B981] px-6 py-8 text-white">
      <div class="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
        <article class="card-flat rounded-lg bg-white/15 p-6">
          <p class="text-xs uppercase tracking-[0.24em] text-white/80">Projects</p>
          <p class="mt-2 text-4xl font-extrabold">{{ projects.length }}</p>
        </article>
        <article class="card-flat rounded-lg bg-white/15 p-6">
          <p class="text-xs uppercase tracking-[0.24em] text-white/80">Active Logs</p>
          <p class="mt-2 text-4xl font-extrabold text-[#FEF3C7]">{{ totalLogs }}</p>
        </article>
        <article class="card-flat rounded-lg bg-white/15 p-6">
          <p class="text-xs uppercase tracking-[0.24em] text-white/80">Active Hours</p>
          <p class="mt-2 text-4xl font-extrabold text-[#DBEAFE]">{{ totalHours }}</p>
        </article>
      </div>
    </section>

    <section v-else class="bg-[#10B981] px-6 py-8 text-white">
      <div class="mx-auto max-w-7xl rounded-lg bg-white/15 p-6 text-sm uppercase tracking-[0.2em] text-white/80">
        Loading saved data...
      </div>
    </section>
    <section class="bg-white px-6 py-10 md:py-14">
      <div class="mx-auto max-w-7xl">
        <div class="grid gap-4 rounded-lg bg-[#F3F4F6] p-6 md:grid-cols-12 md:items-center md:p-8">
          <div class="md:col-span-8">
            <h2 class="text-2xl font-bold text-[#111827] md:text-3xl">
              Create New Project
            </h2>
            <p class="mt-2 text-sm text-[#374151]">
              Home screen for adding entities. You selected "Project", so each project contains its own logs.
            </p>
          </div>

          <form class="grid gap-3 md:col-span-4" @submit.prevent="addProject">
            <input v-model="projectName" placeholder="e.g. DB Sync Fix"
              class="input-flat focus-solid h-14 px-4 text-base" required>
            <button
              class="btn-flat focus-solid h-14 bg-[#10B981] text-sm uppercase tracking-wider text-white hover:bg-[#059669]">
              Add Project
            </button>
          </form>
        </div>
      </div>
    </section>
  </main>
</template>
