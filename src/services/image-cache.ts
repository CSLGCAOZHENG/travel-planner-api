import { readStorage, writeStorage } from '../utils/storage'

interface CacheRecord {
  path: string
  usedAt: number
}

interface DownloadResult {
  statusCode: number
  tempFilePath: string
}

interface SaveResult {
  savedFilePath: string
}

interface MiniFileSystem {
  saveFile: (options: {
    tempFilePath: string
    success: (result: SaveResult) => void
    fail: () => void
  }) => void
  unlink?: (options: { filePath: string; complete: () => void }) => void
}

interface MiniRuntime {
  downloadFile: (options: {
    url: string
    success: (result: DownloadResult) => void
    fail: () => void
  }) => void
  getFileSystemManager: () => MiniFileSystem
}

type CacheManifest = Record<string, CacheRecord>

const MANIFEST_KEY = 'trip-image-cache-v1'
const MAX_CACHED_IMAGES = 40

function getMiniRuntime(): Partial<MiniRuntime> | undefined {
  return (globalThis as typeof globalThis & { wx?: Partial<MiniRuntime> }).wx
}

function readManifest(): CacheManifest {
  try {
    return JSON.parse(readStorage(MANIFEST_KEY) || '{}') as CacheManifest
  } catch {
    return {}
  }
}

function saveManifest(manifest: CacheManifest) {
  writeStorage(MANIFEST_KEY, JSON.stringify(manifest))
}

function downloadImage(runtime: MiniRuntime, url: string) {
  return new Promise<DownloadResult>((resolve, reject) => {
    runtime.downloadFile({ url, success: resolve, fail: reject })
  })
}

function saveImage(fileSystem: MiniFileSystem, tempFilePath: string) {
  return new Promise<SaveResult>((resolve, reject) => {
    fileSystem.saveFile({ tempFilePath, success: resolve, fail: reject })
  })
}

async function trimCache(fileSystem: MiniFileSystem, manifest: CacheManifest) {
  const expired = Object.entries(manifest)
    .sort(([, a], [, b]) => b.usedAt - a.usedAt)
    .slice(MAX_CACHED_IMAGES)
  if (!expired.length) return

  await Promise.all(expired.map(([url, record]) => new Promise<void>((resolve) => {
    delete manifest[url]
    if (typeof fileSystem.unlink !== 'function') {
      resolve()
      return
    }
    fileSystem.unlink({ filePath: record.path, complete: resolve })
  })))
}

export async function cacheRemoteImage(url: string): Promise<string> {
  const runtime = getMiniRuntime()
  if (!url || typeof runtime?.downloadFile !== 'function') return url
  if (typeof runtime?.downloadFile !== 'function' || typeof runtime.getFileSystemManager !== 'function') return url

  const manifest = readManifest()
  const cached = manifest[url]
  if (cached) {
    cached.usedAt = Date.now()
    saveManifest(manifest)
    return cached.path
  }

  try {
    const fileSystem = runtime.getFileSystemManager()
    if (typeof fileSystem?.saveFile !== 'function') return url
    const download = await downloadImage(runtime as MiniRuntime, url)
    if (download.statusCode !== 200 || !download.tempFilePath) return url
    const saved = await saveImage(fileSystem, download.tempFilePath)
    if (!saved.savedFilePath) return url
    manifest[url] = { path: saved.savedFilePath, usedAt: Date.now() }
    await trimCache(fileSystem, manifest)
    saveManifest(manifest)
    return saved.savedFilePath
  } catch {
    return url
  }
}
