interface MiniProgramStorageApi {
  getStorageSync: (key: string) => unknown
  setStorageSync: (key: string, value: unknown) => void
}

const getMiniProgramStorage = () => {
  const runtime = globalThis as typeof globalThis & { wx?: Partial<MiniProgramStorageApi> }
  return runtime.wx
}

export function readStorage(key: string): string {
  try {
    const storage = getMiniProgramStorage()
    if (typeof storage?.getStorageSync === 'function') {
      const value = storage.getStorageSync(key)
      return typeof value === 'string' ? value : ''
    }

    return globalThis.localStorage?.getItem(key) || ''
  } catch {
    return ''
  }
}

export function writeStorage(key: string, value: string) {
  try {
    const storage = getMiniProgramStorage()
    if (typeof storage?.setStorageSync === 'function') {
      storage.setStorageSync(key, value)
      return
    }

    globalThis.localStorage?.setItem(key, value)
  } catch {
    // Storage failures should not prevent the trip page from opening.
  }
}
