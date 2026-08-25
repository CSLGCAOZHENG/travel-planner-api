export type RouteMode = 'walking' | 'bicycling' | 'driving'

export interface GeoPoint {
  longitude: number
  latitude: number
}

export interface RouteResult {
  points: GeoPoint[]
  distance: number
  duration: number
}

interface AmapStep {
  polyline?: string
}

interface AmapPath {
  distance?: string | number
  duration?: string | number
  steps?: AmapStep[]
}

interface AmapRouteResponse {
  status?: string
  info?: string
  route?: { paths?: AmapPath[] }
  data?: { paths?: AmapPath[] }
}

const AMAP_BASE_URL = 'https://restapi.amap.com'
export const amapWebServiceKey = import.meta.env.VITE_AMAP_WEB_SERVICE_KEY || ''

function parsePolyline(polyline = ''): GeoPoint[] {
  return polyline.split(';').map((pair) => {
    const [longitude, latitude] = pair.split(',').map(Number)
    return { longitude, latitude }
  }).filter(point => Number.isFinite(point.longitude) && Number.isFinite(point.latitude))
}

function parsePath(path?: AmapPath): RouteResult {
  if (!path) throw new Error('高德没有返回可用路线')
  const points = (path.steps || []).flatMap(step => parsePolyline(step.polyline))
  return {
    points,
    distance: Number(path.distance || 0),
    duration: Number(path.duration || 0)
  }
}

async function requestSegment(origin: GeoPoint, destination: GeoPoint, mode: RouteMode): Promise<RouteResult> {
  const bicycling = mode === 'bicycling'
  const url = bicycling ? `${AMAP_BASE_URL}/v4/direction/bicycling` : `${AMAP_BASE_URL}/v3/direction/${mode}`
  const response = await uni.request({
    url,
    method: 'GET',
    data: {
      key: amapWebServiceKey,
      origin: `${origin.longitude},${origin.latitude}`,
      destination: `${destination.longitude},${destination.latitude}`,
      ...(mode === 'driving' ? { extensions: 'base', strategy: 0 } : {})
    }
  })
  const body = response.data as AmapRouteResponse
  if (!bicycling && body.status !== '1') throw new Error(body.info || '高德路线请求失败')
  return parsePath(bicycling ? body.data?.paths?.[0] : body.route?.paths?.[0])
}

export function hasAmapKey(): boolean {
  return Boolean(amapWebServiceKey && !amapWebServiceKey.includes('填写'))
}

export async function planAmapRoute(stops: GeoPoint[], mode: RouteMode): Promise<RouteResult> {
  if (!hasAmapKey()) throw new Error('AMAP_KEY_MISSING')
  if (stops.length < 2) return { points: stops, distance: 0, duration: 0 }

  const segments = await Promise.all(stops.slice(0, -1).map((origin, index) => (
    requestSegment(origin, stops[index + 1], mode)
  )))

  return segments.reduce<RouteResult>((route, segment, index) => ({
    points: route.points.concat(index === 0 ? segment.points : segment.points.slice(1)),
    distance: route.distance + segment.distance,
    duration: route.duration + segment.duration
  }), { points: [], distance: 0, duration: 0 })
}
