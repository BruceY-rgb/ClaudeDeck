import { create } from 'zustand'
import type {
  CommunityContributor,
  CommunityResource,
  CommunityOverview,
  InstallResult
} from '@shared/types/community'

interface CommunityStore {
  overview: CommunityOverview | null
  contributors: CommunityContributor[]
  resources: CommunityResource[]
  selectedContributor: CommunityContributor | null
  searchQuery: string
  typeFilter: string
  loading: boolean
  installing: string | null // resourceId being installed

  fetchOverview: () => Promise<void>
  fetchContributors: (query?: string) => Promise<void>
  fetchResources: (contributorId?: string, type?: string) => Promise<void>
  selectContributor: (id: string) => Promise<void>
  clearSelectedContributor: () => void
  installResource: (resourceId: string) => Promise<InstallResult>
  search: (query: string) => Promise<void>
  setTypeFilter: (type: string) => void
  setSearchQuery: (query: string) => void
}

export const useCommunityStore = create<CommunityStore>((set, get) => ({
  overview: null,
  contributors: [],
  resources: [],
  selectedContributor: null,
  searchQuery: '',
  typeFilter: 'all',
  loading: false,
  installing: null,

  async fetchOverview() {
    if (!window.electronAPI) return
    try {
      const overview = await window.electronAPI.community.getOverview()
      set({ overview })
    } catch (err) {
      console.error('[CommunityStore] fetchOverview failed:', err)
    }
  },

  async fetchContributors(query?: string) {
    if (!window.electronAPI) return
    set({ loading: true })
    try {
      const contributors = await window.electronAPI.community.listContributors(query)
      set({ contributors })
    } finally {
      set({ loading: false })
    }
  },

  async fetchResources(contributorId?: string, type?: string) {
    if (!window.electronAPI) return
    set({ loading: true })
    try {
      const resources = await window.electronAPI.community.listResources(contributorId, type)
      set({ resources })
    } finally {
      set({ loading: false })
    }
  },

  async selectContributor(id: string) {
    if (!window.electronAPI) return
    set({ loading: true })
    try {
      const contributor = await window.electronAPI.community.getContributor(id)
      set({ selectedContributor: contributor })
      if (contributor) {
        const resources = await window.electronAPI.community.listResources(id, get().typeFilter)
        set({ resources })
      }
    } finally {
      set({ loading: false })
    }
  },

  clearSelectedContributor() {
    set({ selectedContributor: null, resources: [] })
  },

  async installResource(resourceId: string) {
    if (!window.electronAPI) return { success: false, message: 'API not available' }
    set({ installing: resourceId })
    try {
      const result = await window.electronAPI.community.installResource(resourceId)
      return result
    } finally {
      set({ installing: null })
    }
  },

  async search(query: string) {
    if (!window.electronAPI) return
    set({ loading: true, searchQuery: query })
    try {
      if (query.trim()) {
        const resources = await window.electronAPI.community.search(query)
        set({ resources })
      } else {
        const resources = await window.electronAPI.community.listResources()
        set({ resources })
      }
    } finally {
      set({ loading: false })
    }
  },

  setTypeFilter(type: string) {
    set({ typeFilter: type })
  },

  setSearchQuery(query: string) {
    set({ searchQuery: query })
  }
}))
