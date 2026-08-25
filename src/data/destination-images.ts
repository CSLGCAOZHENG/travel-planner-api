export interface DestinationImageSource {
  keyword: string
  region: string
}

export const destinationImageSources: Record<string, DestinationImageSource> = {
  hangzhou: { keyword: '西湖风景名胜区', region: '杭州' },
  beijing: { keyword: '故宫博物院', region: '北京' },
  chengdu: { keyword: '成都大熊猫繁育研究基地', region: '成都' },
  shanghai: { keyword: '上海外滩', region: '上海' },
  nanchang: { keyword: '南昌之星摩天轮', region: '南昌' },
  xian: { keyword: '大唐不夜城', region: '西安' },
  chongqing: { keyword: '洪崖洞民俗风貌区', region: '重庆' },
  xiamen: { keyword: '鼓浪屿风景名胜区', region: '厦门' },
  qingdao: { keyword: '青岛栈桥', region: '青岛' },
  changsha: { keyword: '橘子洲景区', region: '长沙' },
  suzhou: { keyword: '拙政园', region: '苏州' },
  dali: { keyword: '洱海公园', region: '大理' }
}
