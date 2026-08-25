import { destinationImageSources } from '../data/destination-images'
import { readStorage, writeStorage } from '../utils/storage'
import { cacheRemoteImage } from './image-cache'
import { amapWebServiceKey, hasAmapKey } from './amap'

interface AmapPhoto {
  title?: string
  url?: string
}

interface AmapPoi {
  id?: string
  name?: string
  address?: string
  location?: string
  type?: string
  photos?: AmapPhoto[] | AmapPhoto
  pname?: string
  cityname?: string
}

interface AmapPoiResponse {
  status?: string
  info?: string
  pois?: AmapPoi[]
}

interface AmapDistrict {
  adcode?: string
  name?: string
  center?: string
  level?: string
  citycode?: string
  districts?: AmapDistrict[]
}

interface AmapDistrictResponse {
  status?: string
  info?: string
  districts?: AmapDistrict[]
}

interface PhotoCache {
  expiresAt: number
  images: Record<string, string>
}

export interface PlaceSearchResult {
  id: string
  name: string
  address: string
  longitude?: number
  latitude?: number
  photo: string
  category: string
}

export interface CitySearchResult {
  id: string
  city: string
  region: string
  longitude?: number
  latitude?: number
  photo: string
}

const CACHE_KEY = 'amap-destination-photos-v1'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

function readPhotoCache(): PhotoCache {
  try {
    const value = JSON.parse(readStorage(CACHE_KEY) || '{}') as Partial<PhotoCache>
    return { expiresAt: Number(value.expiresAt || 0), images: value.images || {} }
  } catch {
    return { expiresAt: 0, images: {} }
  }
}

function firstPhotoUrl(poi?: AmapPoi) {
  const photos = poi?.photos
  const url = Array.isArray(photos) ? photos.find(photo => photo?.url)?.url || '' : photos?.url || ''
  return url.replace(/^http:/, 'https:')
}

async function requestPoiPhoto(keyword: string, region: string) {
  const response = await uni.request({
    url: 'https://restapi.amap.com/v5/place/text',
    method: 'GET',
    data: {
      key: amapWebServiceKey,
      keywords: keyword,
      region,
      city_limit: true,
      show_fields: 'photos',
      page_size: 10
    }
  })
  const body = response.data as AmapPoiResponse
  if (body.status !== '1') return ''
  return body.pois?.map(firstPhotoUrl).find(Boolean) || ''
}

async function resolveCachedPaths(images: Record<string, string>) {
  const entries = await Promise.all(Object.entries(images).map(async ([key, url]) => {
    const secureUrl = url.replace(/^http:/, 'https:')
    return [key, await cacheRemoteImage(secureUrl)] as const
  }))
  return Object.fromEntries(entries)
}

export async function loadAmapDestinationPhotos(): Promise<Record<string, string>> {
  const cached = readPhotoCache()
  const sourceEntries = Object.entries(destinationImageSources)
  const cacheIsFresh = cached.expiresAt > Date.now()
  const missingEntries = sourceEntries.filter(([key]) => !cached.images[key])
  if (cacheIsFresh && !missingEntries.length) return resolveCachedPaths(cached.images)
  if (!hasAmapKey()) return resolveCachedPaths(cached.images)

  const entriesToFetch = cacheIsFresh ? missingEntries : sourceEntries
  const entries = await Promise.all(entriesToFetch.map(async ([key, source]) => {
    try {
      return [key, await requestPoiPhoto(source.keyword, source.region)] as const
    } catch {
      return [key, cached.images[key] || ''] as const
    }
  }))
  const images = { ...cached.images, ...Object.fromEntries(entries.filter(([, url]) => Boolean(url))) }
  writeStorage(CACHE_KEY, JSON.stringify({ expiresAt: Date.now() + CACHE_TTL, images }))
  return resolveCachedPaths(images)
}

export async function searchAmapPlaces(keyword: string, city: string): Promise<PlaceSearchResult[]> {
  if (!hasAmapKey() || !keyword.trim()) return []
  const response = await uni.request({
    url: 'https://restapi.amap.com/v5/place/text',
    method: 'GET',
    data: {
      key: amapWebServiceKey,
      keywords: keyword.trim(),
      region: city,
      city_limit: true,
      show_fields: 'photos,business',
      page_size: 12
    }
  })
  const body = response.data as AmapPoiResponse
  if (body.status !== '1') throw new Error(body.info || '地点搜索失败')
  return (body.pois || []).flatMap(poi => {
    if (!poi.id || !poi.name) return []
    const [longitude, latitude] = String(poi.location || '').split(',').map(Number)
    return [{
      id: poi.id,
      name: poi.name,
      address: poi.address || city,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      photo: firstPhotoUrl(poi),
      category: String(poi.type || '').split(';').filter(Boolean).slice(-1)[0] || '地点'
    }]
  })
}

function cityDisplayName(name: string) {
  return name.replace(/(特别行政区|自治区|自治州|地区|省|盟|市)$/u, '') || name
}

function flattenDistricts(districts: AmapDistrict[]): AmapDistrict[] {
  return districts.flatMap(district => [district, ...flattenDistricts(district.districts || [])])
}

function districtSearchRank(district: AmapDistrict, query: string) {
  const name = String(district.name || '')
  const displayName = cityDisplayName(name)
  const exactRank = displayName === query ? 0 : name.startsWith(query) ? 1 : 2
  const levelRank = district.level === 'city' ? 0 : district.level === 'district' ? 1 : 2
  const suffixRank = name.endsWith('市') ? 0 : name.endsWith('县') || name.endsWith('区') ? 2 : 1
  return exactRank * 100 + levelRank * 10 + suffixRank
}

async function requestCityProfile(city: string) {
  const response = await uni.request({
    url: 'https://restapi.amap.com/v5/place/text',
    method: 'GET',
    data: {
      key: amapWebServiceKey,
      keywords: `${city}风景名胜区`,
      region: city,
      city_limit: true,
      show_fields: 'photos',
      page_size: 10
    }
  })
  const body = response.data as AmapPoiResponse
  if (body.status !== '1') return { photo: '', region: '' }
  const pois = body.pois || []
  return {
    photo: pois.map(firstPhotoUrl).find(Boolean) || '',
    region: cityDisplayName(String(pois.find(poi => poi.pname)?.pname || ''))
  }
}

export async function searchAmapCities(keyword: string): Promise<CitySearchResult[]> {
  if (!hasAmapKey() || !keyword.trim()) return []
  const response = await uni.request({
    url: 'https://restapi.amap.com/v3/config/district',
    method: 'GET',
    data: {
      key: amapWebServiceKey,
      keywords: keyword.trim(),
      subdistrict: 1,
      extensions: 'base'
    }
  })
  const body = response.data as AmapDistrictResponse
  if (body.status !== '1') throw new Error(body.info || '城市搜索失败')
  const query = keyword.trim()
  const relatedCandidates = flattenDistricts(body.districts || [])
    .filter(item => item.adcode && item.name && ['province', 'city', 'district'].includes(String(item.level)))
    .filter(item => String(item.name).includes(query) || cityDisplayName(String(item.name)).includes(query))
    .filter((item, index, items) => items.findIndex(other => other.adcode === item.adcode) === index)
    .sort((left, right) => districtSearchRank(left, query) - districtSearchRank(right, query))
  const exactCandidates = relatedCandidates.filter(item => cityDisplayName(String(item.name)) === query)
  const candidates = (exactCandidates.length ? exactCandidates : relatedCandidates).slice(0, 8)

  const results = await Promise.all(candidates.map(async (district) => {
    const city = cityDisplayName(String(district.name))
    const [longitude, latitude] = String(district.center || '').split(',').map(Number)
    const parent = (body.districts || []).find(item => item.adcode !== district.adcode && (item.districts || []).some(child => child.adcode === district.adcode))
    const profile = await requestCityProfile(city)
    return {
      id: `amap-${district.adcode}`,
      city,
      region: profile.region || (parent?.name ? cityDisplayName(parent.name) : district.level === 'province' ? city : '中国'),
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      photo: profile.photo
    }
  }))
  return results
}
