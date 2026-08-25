import type { DayPlan, DestinationTemplate } from '../types/trip'

const hangzhouSchedule: DayPlan[] = [
  { date: '08.30', weekday: '周六', items: [
    { id: 1, time: '09:20', title: '杭州东站', subtitle: '高铁 G1641 · 到达杭州', type: '交通', amount: 0, color: '#4C8DFF', longitude: 120.212249, latitude: 30.290781 },
    { id: 2, time: '10:30', title: '西湖景区', subtitle: '断桥残雪 - 白堤 - 孤山', type: '景点', amount: 0, color: '#2BB673', longitude: 120.148982, latitude: 30.252999 },
    { id: 3, time: '12:30', title: '楼外楼', subtitle: '孤山路30号 · 预订 2 人位', type: '美食', amount: 186, color: '#F2994A', longitude: 120.137798, latitude: 30.253361 },
    { id: 4, time: '15:00', title: '中国美术学院', subtitle: '南山路218号 · 建议停留 2 小时', type: '景点', amount: 0, color: '#2BB673', longitude: 120.159359, latitude: 30.239144 }
  ]},
  { date: '08.31', weekday: '周日', items: [
    { id: 5, time: '09:00', title: '灵隐寺', subtitle: '飞来峰景区入口 · 提前预约', type: '景点', amount: 75, color: '#2BB673', longitude: 120.101406, latitude: 30.240152 },
    { id: 6, time: '13:30', title: '龙井村', subtitle: '九溪十八涧 · 打车约 25 分钟', type: '景点', amount: 0, color: '#2BB673', longitude: 120.109923, latitude: 30.220801 },
    { id: 7, time: '18:30', title: '河坊街', subtitle: '南宋御街夜游 · 小吃路线', type: '美食', amount: 120, color: '#F2994A', longitude: 120.171708, latitude: 30.240803 }
  ]},
  { date: '09.01', weekday: '周一', items: [
    { id: 8, time: '10:00', title: '良渚古城遗址公园', subtitle: '预约入园 · 交通 50 分钟', type: '景点', amount: 60, color: '#2BB673', longitude: 119.990888, latitude: 30.395833 },
    { id: 9, time: '16:40', title: '杭州东站', subtitle: '高铁返程 · 建议提前 40 分钟到达', type: '交通', amount: 0, color: '#4C8DFF', longitude: 120.212249, latitude: 30.290781 }
  ]}
]

const beijingSchedule: DayPlan[] = [
  { date: '09.13', weekday: '周六', items: [
    { id: 101, time: '09:10', title: '北京南站', subtitle: '高铁抵达 · 地铁 4 号线进城', type: '交通', amount: 0, color: '#4C8DFF', longitude: 116.378517, latitude: 39.865246 },
    { id: 102, time: '10:30', title: '天坛公园', subtitle: '祈年殿 - 回音壁 - 圜丘', type: '景点', amount: 34, color: '#2BB673', longitude: 116.417246, latitude: 39.882165 },
    { id: 103, time: '13:00', title: '前门大街', subtitle: '老字号午餐 · 步行逛胡同', type: '美食', amount: 128, color: '#F2994A', longitude: 116.397957, latitude: 39.899188 },
    { id: 104, time: '15:30', title: '故宫博物院', subtitle: '午门进 · 神武门出', type: '景点', amount: 60, color: '#2BB673', longitude: 116.397026, latitude: 39.918058 }
  ]},
  { date: '09.14', weekday: '周日', items: [
    { id: 105, time: '09:00', title: '颐和园', subtitle: '东宫门 - 长廊 - 佛香阁', type: '景点', amount: 30, color: '#2BB673', longitude: 116.273192, latitude: 39.999771 },
    { id: 106, time: '15:30', title: '什刹海', subtitle: '银锭桥看日落 · 胡同散步', type: '景点', amount: 0, color: '#2BB673', longitude: 116.386151, latitude: 39.941137 }
  ]},
  { date: '09.15', weekday: '周一', items: [
    { id: 107, time: '10:00', title: '景山公园', subtitle: '登万春亭看中轴线', type: '景点', amount: 2, color: '#2BB673', longitude: 116.39649, latitude: 39.925416 },
    { id: 108, time: '16:30', title: '北京南站', subtitle: '高铁返程', type: '交通', amount: 0, color: '#4C8DFF', longitude: 116.378517, latitude: 39.865246 }
  ]}
]

const chengduSchedule: DayPlan[] = [
  { date: '09.20', weekday: '周六', items: [
    { id: 201, time: '09:30', title: '成都东站', subtitle: '高铁抵达 · 地铁 2 号线', type: '交通', amount: 0, color: '#4C8DFF', longitude: 104.140804, latitude: 30.62879 },
    { id: 202, time: '10:40', title: '人民公园', subtitle: '鹤鸣茶社喝盖碗茶', type: '景点', amount: 0, color: '#2BB673', longitude: 104.055916, latitude: 30.65893 },
    { id: 203, time: '13:00', title: '宽窄巷子', subtitle: '川菜午餐 · 逛少城街巷', type: '美食', amount: 138, color: '#F2994A', longitude: 104.059047, latitude: 30.66961 },
    { id: 204, time: '17:00', title: '太古里', subtitle: '大慈寺 - 春熙路夜游', type: '景点', amount: 0, color: '#2BB673', longitude: 104.081722, latitude: 30.653862 }
  ]},
  { date: '09.21', weekday: '周日', items: [
    { id: 205, time: '09:00', title: '成都大熊猫基地', subtitle: '建议开园入场 · 看幼年熊猫', type: '景点', amount: 55, color: '#2BB673', longitude: 104.147331, latitude: 30.738109 },
    { id: 206, time: '16:00', title: '望平街', subtitle: '河边咖啡 · 傍晚散步', type: '景点', amount: 0, color: '#2BB673', longitude: 104.094592, latitude: 30.656815 }
  ]},
  { date: '09.22', weekday: '周一', items: [
    { id: 207, time: '10:00', title: '武侯祠', subtitle: '红墙竹影 · 三国文化', type: '景点', amount: 50, color: '#2BB673', longitude: 104.049003, latitude: 30.645394 },
    { id: 208, time: '16:30', title: '成都东站', subtitle: '高铁返程', type: '交通', amount: 0, color: '#4C8DFF', longitude: 104.140804, latitude: 30.62879 }
  ]}
]

const shanghaiSchedule: DayPlan[] = [
  { date: '10.01', weekday: '周三', items: [
    { id: 301, time: '09:20', title: '上海虹桥站', subtitle: '高铁抵达 · 地铁 10 号线', type: '交通', amount: 0, color: '#4C8DFF', longitude: 121.327239, latitude: 31.199668 },
    { id: 302, time: '10:40', title: '武康路', subtitle: '梧桐街区 · 老建筑漫步', type: '景点', amount: 0, color: '#2BB673', longitude: 121.438014, latitude: 31.210465 },
    { id: 303, time: '13:00', title: '豫园', subtitle: '本帮菜午餐 · 九曲桥', type: '美食', amount: 168, color: '#F2994A', longitude: 121.492593, latitude: 31.227107 },
    { id: 304, time: '17:00', title: '外滩', subtitle: '万国建筑群 · 黄浦江夜景', type: '景点', amount: 0, color: '#2BB673', longitude: 121.490317, latitude: 31.239702 }
  ]},
  { date: '10.02', weekday: '周四', items: [
    { id: 305, time: '10:00', title: '上海博物馆东馆', subtitle: '提前预约 · 建议停留 3 小时', type: '景点', amount: 0, color: '#2BB673', longitude: 121.550336, latitude: 31.231756 },
    { id: 306, time: '16:00', title: '陆家嘴滨江', subtitle: '城市天际线 · 江边散步', type: '景点', amount: 0, color: '#2BB673', longitude: 121.503423, latitude: 31.242718 }
  ]},
  { date: '10.03', weekday: '周五', items: [
    { id: 307, time: '10:30', title: '愚园路', subtitle: '社区小店 · 梧桐街区', type: '景点', amount: 0, color: '#2BB673', longitude: 121.430173, latitude: 31.222251 },
    { id: 308, time: '16:20', title: '上海虹桥站', subtitle: '高铁返程', type: '交通', amount: 0, color: '#4C8DFF', longitude: 121.327239, latitude: 31.199668 }
  ]}
]

export const destinationTemplates: DestinationTemplate[] = [
  { id: 'hangzhou', city: '杭州', region: '浙江', title: '杭州慢游', description: '沿着西湖，把三天过得慢一点', moodTitle: '周末去杭州，随心走走', moodCopy: '不赶景点，不追日落。想在湖边坐多久，就坐多久。', travelTip: '西湖到南山路适合骑行，傍晚沿湖回来正好看日落。', coverKey: 'hangzhou', weather: '晴', temperature: 26, dateRange: '08.30 — 09.01', days: 3, nights: 2, schedule: hangzhouSchedule },
  { id: 'beijing', city: '北京', region: '北京', title: '京城秋日', description: '沿着中轴线，慢慢读一座城', moodTitle: '去北京，看古都也看生活', moodCopy: '早起看红墙，傍晚钻胡同。把宏大的北京走成自己的日常。', travelTip: '故宫和天坛都建议提前预约，穿一双适合长距离步行的鞋。', coverKey: 'beijing', weather: '晴', temperature: 23, dateRange: '09.13 — 09.15', days: 3, nights: 2, schedule: beijingSchedule },
  { id: 'chengdu', city: '成都', region: '四川', title: '成都松弛游', description: '喝茶、吃饭，把时间留给街巷', moodTitle: '到成都，先把节奏放慢', moodCopy: '上午喝盖碗茶，下午逛老街，晚上再认真吃一顿火锅。', travelTip: '熊猫基地适合早到，下午回城后把时间留给茶馆和河边。', coverKey: 'chengdu', weather: '多云', temperature: 25, dateRange: '09.20 — 09.22', days: 3, nights: 2, schedule: chengduSchedule },
  { id: 'shanghai', city: '上海', region: '上海', title: '上海城市漫步', description: '从梧桐街区走到黄浦江边', moodTitle: '用脚步认识上海', moodCopy: '老建筑、社区小店和江边夜景，都值得在转角多停一会儿。', travelTip: '武康路和外滩适合分开安排，傍晚去江边能避开最晒的时段。', coverKey: 'shanghai', weather: '晴', temperature: 27, dateRange: '10.01 — 10.03', days: 3, nights: 2, schedule: shanghaiSchedule },
  { id: 'nanchang', city: '南昌', region: '江西', title: '南昌城市漫游', description: '去赣江边看一场城市日落', moodTitle: '在南昌，沿着江风慢慢走', moodCopy: '从老城区走到摩天轮，把一天留给江景与烟火气。', travelTip: '傍晚去赣江边更舒服，摩天轮亮灯后拍照效果更好。', coverKey: 'nanchang', weather: '待查询', temperature: 0, dateRange: '日期待定', days: 3, nights: 2, schedule: [] },
  { id: 'xian', city: '西安', region: '陕西', title: '长安文化之旅', description: '从城墙走进盛唐夜色', moodTitle: '去西安，读一段长安旧梦', moodCopy: '白天看城墙与博物馆，夜晚去感受灯火里的长安。', travelTip: '热门博物馆需要提前预约，大唐不夜城适合晚间安排。', coverKey: 'xian', weather: '待查询', temperature: 0, dateRange: '日期待定', days: 4, nights: 3, schedule: [] },
  { id: 'chongqing', city: '重庆', region: '重庆', title: '山城漫游', description: '穿过坡坎，去看两江夜景', moodTitle: '重庆的路，要慢慢走', moodCopy: '轻轨、老街、火锅和江风，组成一段立体的旅行。', travelTip: '山城步行强度较大，每天不要安排过多跨区景点。', coverKey: 'chongqing', weather: '待查询', temperature: 0, dateRange: '日期待定', days: 3, nights: 2, schedule: [] },
  { id: 'xiamen', city: '厦门', region: '福建', title: '厦门海岛慢游', description: '沿着海岸，把脚步放慢', moodTitle: '去厦门，吹几天海风', moodCopy: '在岛上散步，在老街吃饭，再找一段安静的海岸线。', travelTip: '鼓浪屿船票建议提前购买，岛上更适合步行。', coverKey: 'xiamen', weather: '待查询', temperature: 0, dateRange: '日期待定', days: 4, nights: 3, schedule: [] },
  { id: 'qingdao', city: '青岛', region: '山东', title: '青岛山海之旅', description: '红瓦绿树，也有海风与啤酒', moodTitle: '沿着青岛海岸线走走', moodCopy: '从老城走到海边，把山海和街巷放进同一天。', travelTip: '沿海景点适合顺路安排，风大时记得准备薄外套。', coverKey: 'qingdao', weather: '待查询', temperature: 0, dateRange: '日期待定', days: 3, nights: 2, schedule: [] },
  { id: 'changsha', city: '长沙', region: '湖南', title: '长沙寻味之旅', description: '白天逛城，晚上认真吃饭', moodTitle: '长沙的夜晚，从美食开始', moodCopy: '逛完江洲与老街，再把夜晚留给热闹的街巷。', travelTip: '热门餐厅排队时间较长，景点与用餐时间要留有余量。', coverKey: 'changsha', weather: '待查询', temperature: 0, dateRange: '日期待定', days: 3, nights: 2, schedule: [] },
  { id: 'suzhou', city: '苏州', region: '江苏', title: '苏州园林慢游', description: '在园林和水巷之间散步', moodTitle: '去苏州，慢慢看一座园林城', moodCopy: '窗、廊、桥与水巷，都值得留一点安静的时间。', travelTip: '园林尽量错峰参观，平江路适合安排在傍晚。', coverKey: 'suzhou', weather: '待查询', temperature: 0, dateRange: '日期待定', days: 3, nights: 2, schedule: [] },
  { id: 'dali', city: '大理', region: '云南', title: '大理环洱海', description: '去山海之间过几天慢生活', moodTitle: '在大理，把时间交给风', moodCopy: '早上看苍山，下午沿洱海走，晚上回古城吃饭。', travelTip: '环洱海距离较长，建议分区域安排，不要一天全部走完。', coverKey: 'dali', weather: '待查询', temperature: 0, dateRange: '日期待定', days: 4, nights: 3, schedule: [] }
]

export function createCustomDestination(city: string): DestinationTemplate {
  return {
    id: `custom-${city}`, city, region: '自定义目的地', title: `${city}自由行`, description: '从一个想去的地方，开始安排旅程',
    moodTitle: `下一站，去${city}`, moodCopy: '先把想去的地方放进行程，再慢慢决定每天怎么走。',
    travelTip: '添加第一个地点后，地图会根据真实坐标规划路线。', coverKey: 'default', weather: '待查询', temperature: 0,
    dateRange: '日期待定', days: 3, nights: 2,
    schedule: [
      { date: '待定', weekday: '第 1 天', items: [] },
      { date: '待定', weekday: '第 2 天', items: [] },
      { date: '待定', weekday: '第 3 天', items: [] }
    ]
  }
}
