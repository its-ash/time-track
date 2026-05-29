import { computed, ref, watch } from 'vue'

export type TimeLog = {
  id: string
  note: string
  minutes: number
  createdAt: string
}

export type Project = {
  id: string
  name: string
  createdAt: string
  logs: TimeLog[]
}

export type PaymentRecord = {
  id: string
  projectId: string
  projectName: string
  paidMinutes: number
  paidAt: string
  logs: TimeLog[]
}

type StoreState = {
  projects: Project[]
  payments: PaymentRecord[]
}

const STORAGE_KEY = 'keep-track-store-v1'

const state = ref<StoreState>({
  projects: [],
  payments: []
})

const loaded = ref(false)

const uid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

const readStore = () => {
  if (loaded.value || !import.meta.client) {
    return
  }

  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    loaded.value = true
    return
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoreState>
    state.value = {
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : []
    }
  } catch {
    state.value = { projects: [], payments: [] }
  }

  loaded.value = true
}

if (import.meta.client) {
  readStore()

  watch(
    state,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true }
  )
}

export const useTimeStore = () => {
  readStore()

  const projects = computed(() => state.value.projects)
  const payments = computed(() => state.value.payments)

  const totalActiveMinutes = computed(() => {
    return state.value.projects.reduce((sum, project) => {
      return sum + project.logs.reduce((logSum, log) => logSum + log.minutes, 0)
    }, 0)
  })

  const addProject = (name: string) => {
    const trimmed = name.trim()

    if (!trimmed) {
      return null
    }

    const project: Project = {
      id: uid(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      logs: []
    }

    state.value.projects.unshift(project)
    return project
  }

  const addLog = (projectId: string, note: string, minutes: number) => {
    const project = state.value.projects.find((item) => item.id === projectId)
    const trimmed = note.trim()

    if (!project || !trimmed || minutes <= 0 || minutes % 20 !== 0) {
      return null
    }

    const log: TimeLog = {
      id: uid(),
      note: trimmed,
      minutes,
      createdAt: new Date().toISOString()
    }

    project.logs.unshift(log)
    return log
  }

  const removeLog = (projectId: string, logId: string) => {
    const project = state.value.projects.find((item) => item.id === projectId)

    if (!project) {
      return
    }

    project.logs = project.logs.filter((log) => log.id !== logId)
  }

  const clearProjectLogs = (projectId: string) => {
    const project = state.value.projects.find((item) => item.id === projectId)

    if (!project) {
      return
    }

    project.logs = []
  }

  const deleteProject = (projectId: string) => {
    const project = state.value.projects.find((item) => item.id === projectId)

    if (!project) {
      return { ok: false as const, reason: 'missing' as const }
    }

    if (project.logs.length > 0) {
      return { ok: false as const, reason: 'has_logs' as const }
    }

    state.value.projects = state.value.projects.filter((item) => item.id !== projectId)
    state.value.payments = state.value.payments.filter((item) => item.projectId !== projectId)
    return { ok: true as const }
  }

  const clearAllData = () => {
    state.value = {
      projects: [],
      payments: []
    }
  }

  const getProject = (id: string) => {
    return state.value.projects.find((item) => item.id === id)
  }

  const markPaymentDone = (projectId: string, mode: 'all' | 'custom', customMinutes = 0) => {
    const project = state.value.projects.find((item) => item.id === projectId)

    if (!project || project.logs.length === 0) {
      return null
    }

    const totalMinutes = project.logs.reduce((sum, log) => sum + log.minutes, 0)
    const requested = mode === 'all' ? totalMinutes : customMinutes

    if (requested <= 0 || requested > totalMinutes || requested % 20 !== 0) {
      return null
    }

    const chronological = [...project.logs].reverse()
    const paid: TimeLog[] = []
    const keep: TimeLog[] = []
    let running = 0

    for (const log of chronological) {
      if (running < requested) {
        paid.push(log)
        running += log.minutes
      } else {
        keep.push(log)
      }
    }

    if (running !== requested) {
      return null
    }

    project.logs = keep.reverse()

    const payment: PaymentRecord = {
      id: uid(),
      projectId: project.id,
      projectName: project.name,
      paidMinutes: requested,
      paidAt: new Date().toISOString(),
      logs: paid
    }

    state.value.payments.unshift(payment)
    return payment
  }

  return {
    projects,
    payments,
    totalActiveMinutes,
    addProject,
    addLog,
    removeLog,
    clearProjectLogs,
    deleteProject,
    clearAllData,
    getProject,
    markPaymentDone
  }
}
