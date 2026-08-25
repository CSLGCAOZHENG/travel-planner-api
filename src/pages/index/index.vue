<template>
  <view class="page-shell">
    <template v-if="store.activeTab === '首页'">
      <view class="home-page">
        <view class="home-hero">
          <image class="home-hero-image" :src="activeCover" mode="aspectFill" />
          <view class="home-hero-shade"></view>
          <view class="home-hero-content">
            <view class="home-header"><view class="brand">途屿</view><view class="home-actions"><button class="icon-button" aria-label="消息">···</button><button class="mini-avatar" aria-label="打开我的" @tap="store.activeTab = '我的'">{{ profileInitial }}</button></view></view>
            <view class="home-greeting"><text>下一站，想去哪里？</text><text>把周末留给一座喜欢的城</text></view>
            <button class="create-trip-cta" @tap="openTripCreator()"><view>＋</view><view><text>创建我的行程</text><text>选好目的地和天数，开始安排每一天</text></view><text>›</text></button>
          </view>
          <view class="visual-copy"><text>{{ store.hasTrip ? `${trip.region} · ${trip.city}` : '下一站，由你决定' }}</text><text>{{ store.hasTrip ? trip.description : '先创建一段旅程，再把期待放进每一天。' }}</text></view>
        </view>
        <view class="home-content">
          <view class="section-title-row"><text>我的旅行</text><button @tap="openTripList">查看全部 ›</button></view>
          <scroll-view v-if="store.activeTrips.length" class="trip-carousel" scroll-x :show-scrollbar="false" enhanced>
            <view class="trip-carousel-track">
              <button v-for="item in store.activeTrips" :key="item.id" class="current-trip trip-slide" @tap="openPlannedTrip(item)">
                <image :src="destinationCover(item.coverKey, item.coverUrl)" mode="aspectFill" />
                <view class="current-trip-main"><view><text class="current-trip-title">{{ item.title }}</text><text class="trip-status">{{ tripStatusLabel(item) }}</text></view><text>{{ item.dateRange }} · {{ item.days }}天{{ item.nights }}晚</text><view class="trip-progress"><view :style="{ width: `${tripProgress(item)}%` }"></view></view><text class="current-trip-foot">{{ tripCardHint(item) }}</text></view>
                <text class="current-trip-arrow">›</text>
              </button>
              <button class="new-trip-slide" @tap="openTripCreator()"><text>＋</text><text>再创建一段旅程</text></button>
            </view>
          </scroll-view>
          <button v-else class="empty-trip-card" @tap="openTripCreator()"><view>＋</view><view><text>还没有规划好的旅行</text><text>选择目的地，为每一天添加安排</text></view><text>›</text></button>
          <view class="section-title-row home-section-title"><text>灵感目的地</text><button @tap="openTripCreator()">更多目的地 ›</button></view>
          <view class="inspiration-grid">
            <button v-for="destination in inspirationDestinations" :key="destination.id" class="inspiration-card" @tap="openTripCreator(destination)">
              <image :src="destinationCover(destination.coverKey, destination.coverUrl)" mode="aspectFill" />
              <view class="inspiration-copy"><text>{{ destination.city }}</text><text>{{ destination.moodCopy.slice(0, 8) }}</text></view>
            </button>
          </view>
        </view>
      </view>
    </template>

    <template v-else-if="store.activeTab === '行程'">
      <view class="itinerary-page">
        <view class="page-header itinerary-header"><button class="icon-button back-button" aria-label="返回" @tap="backFromTripDetail">‹</button><text>{{ trip.title }}</text><button class="icon-button" aria-label="更多">···</button></view>
        <view class="trip-overview"><view><text>{{ trip.dateRange }}</text><text>{{ trip.days }}天{{ trip.nights }}晚 · {{ trip.city }}</text></view><view v-if="trip.temperature > 0 && trip.weather !== '待查询'" class="overview-weather"><text>☀</text><view><text>{{ trip.temperature }}°C</text><text>{{ trip.weather }}</text></view></view></view>
        <scroll-view class="day-tabs-scroll" scroll-x :show-scrollbar="false"><view class="day-tabs"><button v-for="(day, index) in store.schedule" :key="`${day.date}-${index}`" :class="{ active: store.activeDay === index }" @tap="store.activeDay = index"><text>第{{ index + 1 }}天</text><text>{{ day.date }}</text></button></view></scroll-view>
        <view class="day-count-control"><view><text>{{ store.currentDay.city || trip.city }}</text><text>停留 {{ currentCityDays }} 天 · 全程 {{ store.schedule.length }} 天</text></view><view><button :disabled="currentCityDays <= 1" aria-label="减少当前城市一天" @tap="removeCurrentDay">−</button><text>停留天数</text><button aria-label="当前城市增加一天" @tap="addTripDay">＋</button></view></view>
        <view class="itinerary-toolbar"><view><text>今日安排</text><text>{{ store.currentDay.city || trip.city }} · {{ store.currentDay.items.length }} 个地点</text></view><button @tap="store.activeTab = '地图'">⌖ 查看地图</button></view>
        <view v-if="store.currentDay.items.length > 1" class="drag-sort-hint"><text>↕</text><text>长按地点卡片，上下拖动调整顺序</text></view>
        <view class="timeline">
          <view v-for="(item, index) in store.currentDay.items" :key="item.id" class="timeline-row" :class="{ 'is-dragging': draggingPlaceId === item.id, 'is-shifting': draggingPlaceId !== null && draggingPlaceId !== item.id && rowShift(index) !== 0 }" :style="placeRowStyle(item.id, index)" @longpress="startPlaceDrag(item.id, $event)" @touchstart="startPlaceTouch(item.id, $event)" @touchmove="movePlaceTouch(item.id, $event)" @touchend="endPlaceTouch(item.id)" @touchcancel="endPlaceTouch(item.id)">
            <view class="timeline-time"><text>{{ item.time }}</text><text>{{ timePeriod(item.time) }}</text></view>
            <view class="timeline-rail"><view :style="{ backgroundColor: item.color }">{{ index + 1 }}</view><text v-if="index < store.currentDay.items.length - 1"></text></view>
            <view class="timeline-swipe-shell">
              <button class="swipe-delete" aria-label="删除地点" @tap.stop="confirmDeletePlace(item.id)">删除</button>
              <view class="timeline-main" :class="{ 'is-opening': openingPlaceId === item.id }" :style="{ transform: `translateX(${swipeOffset(item.id)}px)` }">
                <view class="place-card" @tap="openPlaceFromCard(item.id)">
                  <view class="timeline-title"><view><text>{{ item.title }}</text><text :style="{ color: item.color }">{{ item.type }}</text></view><text class="edit-hint">点击编辑 ›</text></view>
                  <view class="timeline-photo"><image :src="placePhoto(item, index)" mode="aspectFill" /></view>
                  <view class="place-address"><text>⌖</text><text>{{ placeAddress(item) }}</text></view>
                  <view v-if="item.note" class="place-note"><text>备注</text><text>{{ item.note }}</text></view>
                  <view class="timeline-meta"><text>◷ {{ item.duration || stayDuration(item.type) }}</text><button @tap.stop="navigateTo(item.title)">导航 ›</button></view>
                </view>
                <view v-if="index < store.currentDay.items.length - 1" class="transport-hint"><text>{{ routeModeIcon }}</text><text>{{ segmentHint(index) }}</text></view>
              </view>
            </view>
          </view>
          <view v-if="!store.currentDay.items.length" class="empty-itinerary"><text>今天还没有安排</text><text>添加景点、餐厅或酒店后，地图会自动规划路线。</text></view>
        </view>
        <button class="add-place" @tap="openPlaceEditor()"><text>＋</text> 添加地点</button>
      </view>
    </template>

    <template v-else-if="store.activeTab === '地图'">
      <view class="map-page">
        <view class="page-header map-header"><button class="icon-button back-button" aria-label="返回行程" @tap="store.activeTab = '行程'">‹</button><text>今日路线</text><button class="replan-button" :disabled="routeStatus === 'loading'" @tap="loadRoute">重新规划</button></view>
        <view class="route-mode-switch" aria-label="出行方式"><button v-for="mode in routeModes" :key="mode.value" :class="{ active: routeMode === mode.value }" @tap="routeMode = mode.value"><text>{{ mode.icon }}</text>{{ mode.label }}</button></view>
        <view class="map-stage">
          <map id="trip-map" class="trip-map" :longitude="mapCenter.longitude" :latitude="mapCenter.latitude" :scale="12" :markers="mapMarkers" :polyline="mapPolyline" :include-points="mapPoints" :show-location="true" @markertap="handleMarkerTap" />
          <view v-if="routeStatus !== 'ready'" class="map-state" :class="routeStatus"><text>{{ routeStatus === 'loading' ? '···' : '高' }}</text><view><text>{{ mapStateTitle }}</text><text>{{ mapStateDescription }}</text></view></view>
          <view class="map-provider"><text></text>{{ routeStatus === 'ready' ? '高德路线规划' : '真实坐标预览' }}</view>
        </view>
        <view class="route-sheet"><view class="sheet-handle"></view><view class="route-summary"><view><text>全程 {{ distanceLabel }}</text><text>{{ durationLabel }}</text></view><text>{{ store.currentDay.items.length }} 个地点</text></view><scroll-view class="route-list" scroll-y><button v-for="(item, index) in store.currentDay.items" :key="item.id" class="route-row" :class="{ selected: selectedPlaceId === item.id }" @tap="selectMapPlace(item.id)"><view class="route-index" :style="{ backgroundColor: item.color }">{{ index + 1 }}</view><view><text>{{ item.title }}</text><text>{{ item.time }} · {{ item.type }}<template v-if="index < store.currentDay.items.length - 1"> · {{ segmentHint(index) }}</template></text></view><text>›</text></button></scroll-view></view>
      </view>
    </template>

    <template v-else>
      <view class="mine-page">
        <view class="page-header mine-header"><text>我的旅行</text><view class="profile-avatar">{{ profileInitial }}</view></view>
        <view class="profile-block"><view><text>{{ profile.name }}</text><text>{{ profileSummary }}</text></view><button @tap="openProfileEditor">编辑资料</button></view>
        <view class="profile-stats"><view><text>{{ store.trips.length }}</text><text>旅行</text></view><button class="profile-city-stat" @tap="showVisitedCities = true"><text>{{ visitedCities.length }}</text><text>城市</text></button></view>
        <view class="section-title-row mine-title"><text>旅行工具</text></view>
        <view class="tool-grid"><button v-for="tool in tools" :key="tool.name" @tap="toolAction(tool.name)"><view :style="{ color: tool.color, backgroundColor: tool.background }">{{ tool.icon }}</view><text>{{ tool.name }}</text><text>{{ tool.caption }}</text></button></view>
        <view class="settings-list"><button @tap="toolAction('关于途屿')"><text>关于途屿</text><text>›</text></button></view>
      </view>
    </template>

    <view v-if="!showCreateTrip && !showPlaceEditor && !showProfileEditor" class="bottom-nav safe-bottom"><button v-for="tab in tabs" :key="tab" :class="{ active: store.activeTab === tab || (tab === '行程' && (showTripList || store.activeTab === '地图')) }" @tap="switchTab(tab)"><view>{{ icons[tab] }}</view><text>{{ tab }}</text></button></view>

    <view v-if="showCreateTrip" class="destination-overlay" @tap="closeTripCreator">
      <view class="destination-modal creation-modal" @tap.stop>
        <view class="modal-handle"></view>
        <view class="modal-header"><view><text>{{ creationStep === 1 ? '选择目的地' : '设置旅行计划' }}</text><text>{{ creationStep === 1 ? '可以选择一座或多座城市' : creationDateMode === 'dates' ? `${creationCityLabel} · 共 ${plannedDays} 天` : creationCityLabel }}</text></view><button class="icon-button" aria-label="关闭" @tap="closeTripCreator">×</button></view>
        <view class="creation-steps"><view :class="{ active: creationStep >= 1 }"><text>1</text><text>目的地</text></view><text class="creation-step-line"></text><view :class="{ active: creationStep >= 2 }"><text>2</text><text>日期与天数</text></view></view>
        <template v-if="creationStep === 1">
          <view class="destination-search modal-search"><text class="search-icon">⌕</text><input v-model="destinationQuery" confirm-type="search" placeholder="搜索任意城市，例如青岛" /></view>
          <scroll-view v-if="selectedDestinations.length" class="selected-city-scroll" scroll-x :show-scrollbar="false"><view class="selected-city-list"><view v-for="(destination, index) in selectedDestinations" :key="destination.id" class="selected-city-chip"><text>{{ index + 1 }}</text><text>{{ destination.city }}</text><button :aria-label="`移除${destination.city}`" @tap="removeCreationDestination(destination.id)">×</button></view></view></scroll-view>
          <scroll-view class="modal-scroll creation-scroll" scroll-y>
            <view class="creation-result-title"><text>{{ destinationQuery.trim() ? '高德城市搜索' : '热门目的地' }}</text><text>{{ citySearching ? '搜索中…' : `${filteredDestinations.length} 个城市` }}</text></view>
            <view class="modal-grid">
              <button v-for="destination in filteredDestinations" :key="destination.id" class="modal-destination" :class="{ selected: selectedDestinationIndex(destination.id) >= 0 }" @tap="toggleCreationDestination(destination)">
                <image :src="destinationCover(destination.coverKey, destination.coverUrl)" mode="aspectFill" />
                <view><text>{{ destination.city }}</text><text>{{ destination.region }} · {{ destination.description }}</text></view>
                <text v-if="selectedDestinationIndex(destination.id) >= 0" class="selected-mark">{{ selectedDestinationIndex(destination.id) + 1 }}</text>
              </button>
            </view>
            <view v-if="destinationQuery.trim() && !filteredDestinations.length && !citySearching" class="creation-no-result"><text>没有找到相关城市</text><text>请检查城市名称后重新搜索</text></view>
          </scroll-view>
          <button class="creation-primary" :disabled="!selectedDestinations.length" @tap="creationStep = 2">{{ selectedDestinations.length ? `下一步 · 已选 ${selectedDestinations.length} 城` : '请先选择目的地' }}</button>
        </template>
        <template v-else>
          <scroll-view class="creation-form-scroll" scroll-y>
            <view class="creation-section-heading"><text>什么时候出发</text><text>日期可以稍后再确定</text></view>
            <view class="date-mode-switch"><button :class="{ active: creationDateMode === 'dates' }" @tap="creationDateMode = 'dates'">确定日期</button><button :class="{ active: creationDateMode === 'days' }" @tap="creationDateMode = 'days'">暂不确定</button></view>
            <template v-if="creationDateMode === 'dates'">
              <view class="form-field"><text>出发日期</text><picker mode="date" :value="creationStartDate" :start="todayDate" @change="handleStartDateChange"><view class="date-picker-value"><text>{{ creationStartDate }}</text><text>›</text></view></picker></view>
              <view class="creation-section-heading date-heading"><text>每座城市停留几天</text><text>使用加减按钮分配行程天数</text></view>
              <view class="city-day-list"><view v-for="(destination, index) in selectedDestinations" :key="destination.id" class="city-day-row"><image :src="destinationCover(destination.coverKey, destination.coverUrl)" mode="aspectFill" /><view><text>{{ destination.city }}</text><text>第 {{ cityStartDay(index) }}–{{ cityEndDay(index) }} 天 · 停留</text></view><view class="compact-stepper"><button :disabled="cityDays[destination.id] <= 1" :aria-label="`减少${destination.city}停留天数`" @tap="changeCityDays(destination.id, -1)">−</button><text>{{ cityDays[destination.id] }} 天</text><button :disabled="plannedDays >= 30" :aria-label="`增加${destination.city}停留天数`" @tap="changeCityDays(destination.id, 1)">＋</button></view></view></view>
              <view class="trip-days-summary"><view><text>行程总览</text><text>{{ selectedDestinations.length }} 座城市</text></view><text>{{ plannedDays }} 天 {{ Math.max(0, plannedDays - 1) }} 晚</text></view>
            </template>
            <view class="form-field"><text>行程名称（可选）</text><input v-model="creationTitle" :placeholder="defaultCreationTitle" maxlength="20" /></view>
            <view v-if="creationDateMode === 'dates'" class="creation-preview"><text>创建后将生成</text><view><text v-for="day in plannedDays" :key="day">Day {{ day }}</text></view><text>{{ creationCityLabel }}的每日计划会保持空白，随后可以添加地点。</text></view>
          </scroll-view>
          <view class="creation-actions"><button @tap="creationStep = 1">上一步</button><button @tap="createPlannedTrip">创建并规划</button></view>
        </template>
      </view>
    </view>

    <view v-if="showTripList" class="trip-list-overlay">
      <view class="trip-list-header"><button class="icon-button back-button" aria-label="关闭" @tap="showTripList = false">‹</button><view><text>我的行程</text><text>{{ store.trips.length }} 段旅程</text></view><button class="trip-list-create" @tap="openTripCreator()">＋ 新建</button></view>
      <view class="trip-list-tabs"><button v-for="tab in tripListTabs" :key="tab.value" :class="{ active: tripListTab === tab.value }" @tap="tripListTab = tab.value"><text>{{ tab.label }}</text><text>{{ tripListCount(tab.value) }}</text></button></view>
      <scroll-view class="trip-list-scroll" scroll-y>
        <view v-if="store.planningTrips.length" class="continue-planning">
          <view class="continue-planning-title"><view><text>继续规划</text><text>把还没安排好的旅程补充完整</text></view><text>{{ store.planningTrips.length }}</text></view>
          <scroll-view class="planning-scroll" scroll-x :show-scrollbar="false"><view class="planning-track"><button v-for="item in store.planningTrips" :key="item.id" class="planning-card" @tap="openPlannedTrip(item, 'list')"><image :src="destinationCover(item.coverKey, item.coverUrl)" mode="aspectFill" /><view><text>{{ item.title }}</text><text>{{ planningHint(item) }}</text></view><text>›</text></button></view></scroll-view>
        </view>
        <view v-if="visibleTripList.length" class="trip-list-content">
          <button v-for="item in visibleTripList" :key="item.id" class="trip-list-card" @tap="openPlannedTrip(item, 'list')">
            <image :src="destinationCover(item.coverKey, item.coverUrl)" mode="aspectFill" />
            <view><view><text>{{ item.title }}</text><text>{{ tripStatusLabel(item) }}</text></view><text>{{ item.region }} · {{ item.city }}</text><text>{{ item.dateRange }} · {{ item.days }}天{{ item.nights }}晚</text><text>{{ tripPlaceCount(item) }} 个地点已安排</text></view><text>›</text>
          </button>
        </view>
        <view v-else class="trip-list-empty"><text>这里还没有行程</text><text>{{ tripListEmptyText }}</text><button v-if="tripListTab !== 'history'" @tap="openTripCreator()">创建行程</button></view>
      </scroll-view>
    </view>

    <view v-if="showPlaceEditor" class="destination-overlay place-editor-overlay" @tap="closePlaceEditor">
      <view class="destination-modal place-editor-sheet" @tap.stop>
        <view class="modal-handle"></view>
        <view class="modal-header place-editor-header"><view><text>{{ editingPlaceId ? '编辑地点' : '添加地点' }}</text><text>{{ store.currentDay.city || trip.city }} · Day {{ store.activeDay + 1 }}</text></view><button class="icon-button" aria-label="关闭地点编辑" @tap="closePlaceEditor">×</button></view>
        <view class="place-search-box"><view><text>⌕</text><input v-model="placeQuery" confirm-type="search" :placeholder="`搜索${store.currentDay.city || trip.city}的地点`" @confirm="searchPlaces" /><button v-if="placeQuery" aria-label="清空搜索" @tap="clearPlaceSearch">×</button></view><text>输入景点、餐厅、酒店或详细地址，高德会实时查找</text></view>
        <scroll-view v-if="placeSearchResults.length || placeSearching" class="place-search-results" scroll-y>
          <view v-if="placeSearching" class="place-search-loading">正在从高德查找地点…</view>
          <view v-else class="place-result-list"><button v-for="result in placeSearchResults" :key="result.id" :class="{ selected: selectedPoiId === result.id }" @tap="selectPlaceResult(result)"><image v-if="result.photo" :src="result.photo" mode="aspectFill" /><view v-else class="place-result-fallback">高</view><view><text>{{ result.name }}</text><text>{{ result.category }} · {{ result.address }}</text></view><text>›</text></button></view>
        </scroll-view>
        <scroll-view v-if="placeForm.title" class="place-form-scroll" scroll-y>
          <view class="selected-place-card"><image :src="placeForm.photo || activeCover" mode="aspectFill" /><view><text>{{ placeForm.title }}</text><text>{{ placeForm.type }}</text><text>{{ placeForm.address }}</text></view><text>已选择</text></view>
          <view class="place-form-grid">
            <view class="form-field"><text>到达时间</text><picker mode="time" :value="placeForm.time === '待定' ? '09:00' : placeForm.time" @change="handlePlaceTimeChange"><view class="date-picker-value"><text>{{ placeForm.time }}</text><text>›</text></view></picker></view>
            <view class="form-field"><text>停留时长</text><picker :range="durationOptions" :value="durationIndex" @change="handleDurationChange"><view class="date-picker-value"><text>{{ placeForm.duration }}</text><text>›</text></view></picker></view>
            <view class="form-field place-note-field"><text>备注</text><textarea v-model="placeForm.note" placeholder="例如：提前预约、想看的展区或集合信息" maxlength="200" auto-height /></view>
          </view>
        </scroll-view>
        <view class="place-editor-actions"><button class="place-save-button" :disabled="!placeForm.poiId" @tap="savePlace">{{ editingPlaceId ? '保存修改' : '添加到今天' }}</button></view>
      </view>
    </view>

    <view v-if="showProfileEditor" class="destination-overlay profile-editor-overlay" @tap="showProfileEditor = false">
      <view class="destination-modal profile-editor-sheet" @tap.stop>
        <view class="modal-handle"></view>
        <view class="modal-header profile-editor-header"><view><text>编辑资料</text><text>完善你的个人信息</text></view><button class="icon-button" aria-label="关闭资料编辑" @tap="showProfileEditor = false">×</button></view>
        <view class="profile-form">
          <view class="profile-form-field"><text>用户名</text><input v-model="profileDraft.name" maxlength="12" placeholder="请输入用户名" /></view>
          <view class="profile-form-field"><text>年龄</text><picker :range="ageOptions" :value="profileDraft.age - 1" @change="handleAgeChange"><view class="profile-picker-value"><text>{{ profileDraft.age }} 岁</text><text>›</text></view></picker></view>
          <view class="profile-form-field"><text>性别</text><view class="gender-switch"><button v-for="gender in genderOptions" :key="gender" :class="{ active: profileDraft.gender === gender }" @tap="profileDraft.gender = gender">{{ gender }}</button></view></view>
        </view>
        <button class="profile-save-button" @tap="saveProfile">保存资料</button>
      </view>
    </view>

    <view v-if="showVisitedCities" class="visited-city-overlay">
      <view class="visited-city-header"><button class="icon-button back-button" aria-label="返回我的" @tap="showVisitedCities = false">‹</button><view><text>去过的城市</text><text>{{ visitedCities.length }} 座城市</text></view><text></text></view>
      <scroll-view class="visited-city-scroll" scroll-y>
        <view v-if="visitedCities.length" class="visited-city-grid"><view v-for="city in visitedCities" :key="city.id" class="visited-city-card"><image :src="destinationCover(city.coverKey, city.coverUrl)" mode="aspectFill" /><view><text>{{ city.city }}</text><text>{{ city.region }}</text></view></view></view>
        <view v-else class="visited-city-empty"><text>还没有旅行足迹</text><text>正在进行或已经结束的旅行城市会出现在这里。</text></view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import hangzhouReference from '../../assets/generated/hangzhou-reference.jpg'
import beijingReference from '../../assets/generated/beijing-reference.jpg'
import chengduReference from '../../assets/generated/chengdu-reference.jpg'
import shanghaiReference from '../../assets/generated/shanghai-reference.jpg'
import lakeWalkImage from '../../assets/west-lake-walk.jpg'
import foodImage from '../../assets/hangzhou-food.jpg'
import artCampusImage from '../../assets/art-campus.jpg'
import mapMarkerIcon from '../../assets/map-marker.png'
import { useTripStore } from '../../stores/trip'
import { destinationTemplates } from '../../data/destinations'
import { hasAmapKey, planAmapRoute, type GeoPoint, type RouteMode } from '../../services/amap'
import { loadAmapDestinationPhotos, searchAmapCities, searchAmapPlaces, type CitySearchResult, type PlaceSearchResult } from '../../services/amap-poi'
import { cacheRemoteImage } from '../../services/image-cache'
import { readStorage, writeStorage } from '../../utils/storage'
import type { DestinationTemplate, PlanItem, PlannedTrip, PlaceType, TripStatus } from '../../types/trip'

type ProfileGender = '男' | '女' | '保密'
interface UserProfile { name: string; age: number; gender: ProfileGender }

function loadProfile(): UserProfile {
  try {
    const saved = JSON.parse(readStorage('travel-user-profile') || '{}') as Partial<UserProfile>
    return { name: saved.name?.trim() || 'Momo', age: Math.max(1, Math.min(100, Number(saved.age || 25))), gender: ['男', '女', '保密'].includes(String(saved.gender)) ? saved.gender as ProfileGender : '保密' }
  } catch {
    return { name: 'Momo', age: 25, gender: '保密' }
  }
}

const store = useTripStore()
const destinationQuery = ref('')
const selectedPlaceId = ref<number | null>(null)
const resolvedImages = ref<Record<string, string>>({})
const showCreateTrip = ref(false)
const creationStep = ref<1 | 2>(1)
const selectedDestinations = ref<DestinationTemplate[]>([])
const citySearchResults = ref<DestinationTemplate[]>([])
const citySearching = ref(false)
const cityDays = ref<Record<string, number>>({})
const creationDateMode = ref<'dates' | 'days'>('dates')
const creationTitle = ref('')
const showTripList = ref(false)
const tripListTab = ref<'ongoing' | 'upcoming' | 'history'>('upcoming')
const tripDetailOrigin = ref<'home' | 'list'>('home')
const todayDate = formatIsoDate(new Date())
const creationStartDate = ref(todayDate)
const showPlaceEditor = ref(false)
const editingPlaceId = ref<number | null>(null)
const placeQuery = ref('')
const placeSearching = ref(false)
const placeSearchResults = ref<PlaceSearchResult[]>([])
const selectedPoiId = ref('')
const placeForm = ref({ title: '', address: '', note: '', photo: '', duration: '2 小时', time: '待定', type: '景点' as PlaceType, latitude: undefined as number | undefined, longitude: undefined as number | undefined, poiId: '' })
const draggingPlaceId = ref<number | null>(null)
const dragOffset = ref(0)
const dragTargetIndex = ref(-1)
const swipeOffsets = ref<Record<number, number>>({})
const openingPlaceId = ref<number | null>(null)
const profile = ref<UserProfile>(loadProfile())
const profileDraft = ref<UserProfile>({ ...profile.value })
const showProfileEditor = ref(false)
const showVisitedCities = ref(false)
const ageOptions = Array.from({ length: 100 }, (_, index) => index + 1)
const genderOptions: ProfileGender[] = ['男', '女', '保密']
const durationOptions = ['30 分钟', '1 小时', '1.5 小时', '2 小时', '3 小时', '半天', '全天']
let dragStartY = 0
let dragSourceIndex = -1
let draggedRowHeight = 0
let pendingDragY = 0
let touchStartX = 0
let touchStartY = 0
let touchStartOffset = 0
let touchMoved = false
let suppressCardTap = false
let dragRects: Array<{ top: number; bottom: number }> = []
let dragFrameTimer: ReturnType<typeof setTimeout> | null = null
let citySearchTimer: ReturnType<typeof setTimeout> | null = null
let placeSearchTimer: ReturnType<typeof setTimeout> | null = null
const coverImages: Record<string, string> = {
  hangzhou: hangzhouReference,
  beijing: beijingReference,
  chengdu: chengduReference,
  shanghai: shanghaiReference,
  default: hangzhouReference
}
const tabs = ['首页', '行程', '我的'] as const
const icons = { 首页: '⌂', 行程: '▣', 我的: '○' }
const tools = [
  { name: '旅行预算', caption: `¥${store.budget}`, icon: '¥', color: '#D86E63', background: '#FFF0EE' },
  { name: '出行清单', caption: '还剩 3 项', icon: '✓', color: '#31856C', background: '#E6F4EE' }
]
const routeModes: { value: RouteMode; label: string; icon: string }[] = [{ value: 'walking', label: '步行', icon: '步' }, { value: 'bicycling', label: '骑行', icon: '骑' }, { value: 'driving', label: '驾车', icon: '车' }]
const placeTypes: { value: PlaceType; icon: string; color: string }[] = [{ value: '景点', icon: '景', color: '#2BB673' }, { value: '美食', icon: '食', color: '#F2994A' }, { value: '住宿', icon: '住', color: '#9B6FD4' }, { value: '交通', icon: '行', color: '#4C8DFF' }]
const routeMode = ref<RouteMode>('walking')
const routeStatus = ref<'missing' | 'loading' | 'ready' | 'error' | 'empty'>(hasAmapKey() ? 'loading' : 'missing')
const routePoints = ref<GeoPoint[]>([])
const routeDistance = ref(0)
const routeDuration = ref(0)
let routeRequestId = 0

const tripListTabs = [{ value: 'ongoing', label: '进行中' }, { value: 'upcoming', label: '待出发' }, { value: 'history', label: '已结束' }] as const
const trip = computed(() => store.currentTrip || destinationTemplates[0])
const activeCover = computed(() => destinationCover(trip.value.coverKey, trip.value.coverUrl))
const inspirationDestinations = computed(() => destinationTemplates.filter(item => item.id !== store.currentTrip?.destinationId).slice(0, 3))
const visibleTripList = computed(() => tripListTab.value === 'ongoing' ? store.ongoingTrips : tripListTab.value === 'upcoming' ? store.upcomingTrips : store.historyTrips)
const tripListEmptyText = computed(() => tripListTab.value === 'ongoing' ? '出发后，旅行会自动进入这里。' : tripListTab.value === 'upcoming' ? '确定出发日期后，行程会出现在这里。' : '结束的旅程会保存在这里。')
const filteredDestinations = computed(() => destinationQuery.value.trim() ? citySearchResults.value : destinationTemplates)
const plannedDays = computed(() => selectedDestinations.value.reduce((sum, destination) => sum + Number(cityDays.value[destination.id] || 1), 0))
const creationCityLabel = computed(() => selectedDestinations.value.map(destination => destination.city).join(' → '))
const defaultCreationTitle = computed(() => {
  const cities = selectedDestinations.value
  if (!cities.length) return '我的旅行'
  const cityLabel = cities.length === 1 ? cities[0].city : cities.length === 2 ? cities.map(city => city.city).join('·') : `${cities[0].city}等${cities.length}城`
  const days = creationDateMode.value === 'dates' ? plannedDays.value : Math.max(1, cities.length)
  return `${cityLabel}${days}日游`
})
const durationIndex = computed(() => Math.max(0, durationOptions.indexOf(placeForm.value.duration)))
const currentCityDays = computed(() => store.schedule.filter(day => day.cityId === store.currentDay.cityId).length || store.schedule.length)
const profileInitial = computed(() => profile.value.name.trim().slice(0, 1).toUpperCase() || 'M')
const profileSummary = computed(() => `${profile.value.age} 岁 · ${profile.value.gender}`)
const visitedCities = computed(() => {
  const records = store.trips
    .filter(item => ['ongoing', 'expired'].includes(store.getTripStatus(item)))
    .flatMap(item => item.destinations?.length ? item.destinations : [{ id: item.destinationId, city: item.city, region: item.region, coverKey: item.coverKey, coverUrl: item.coverUrl, days: item.days, order: 0 }])
  return records.filter((city, index, items) => items.findIndex(item => item.city === city.city) === index)
})
const mapPoints = computed<GeoPoint[]>(() => store.currentDay.items.filter(item => item.latitude != null && item.longitude != null).map(item => ({ latitude: item.latitude!, longitude: item.longitude! })))
const mapCenter = computed(() => { if (!mapPoints.value.length) return { longitude: 120.1551, latitude: 30.2741 }; return mapPoints.value.reduce((center, point) => ({ longitude: center.longitude + point.longitude / mapPoints.value.length, latitude: center.latitude + point.latitude / mapPoints.value.length }), { longitude: 0, latitude: 0 }) })
const mapMarkers = computed(() => store.currentDay.items.flatMap((item, index) => item.latitude == null || item.longitude == null ? [] : [{ id: item.id, latitude: item.latitude, longitude: item.longitude, iconPath: mapMarkerIcon, width: selectedPlaceId.value === item.id ? 38 : 32, height: selectedPlaceId.value === item.id ? 47 : 40, anchor: { x: 0.5, y: 1 }, label: { content: String(index + 1), color: '#FFFFFF', fontSize: 13, anchorX: -4, anchorY: -32 } }]))
const mapPolyline = computed(() => routeStatus.value === 'ready' && routePoints.value.length ? [{ points: routePoints.value, color: '#138F86EE', width: 7, arrowLine: true, borderColor: '#FFFFFFCC', borderWidth: 2 }] : [])
const routeModeLabel = computed(() => routeModes.find(mode => mode.value === routeMode.value)?.label || '')
const routeModeIcon = computed(() => routeModes.find(mode => mode.value === routeMode.value)?.icon || '步')
const distanceLabel = computed(() => routeStatus.value === 'ready' ? `${(routeDistance.value / 1000).toFixed(1)} 公里` : '-- 公里')
const durationLabel = computed(() => routeStatus.value === 'ready' ? `约 ${Math.max(1, Math.round(routeDuration.value / 60))} 分钟` : '路线计算中')
const mapStateTitle = computed(() => ({ missing: '等待接入高德 API', loading: '正在规划真实路线', error: '路线暂时没有规划成功', empty: '还没有可规划的地点', ready: '' }[routeStatus.value]))
const mapStateDescription = computed(() => ({ missing: '地点已按真实坐标标记', loading: `正在计算${routeModeLabel.value}距离和预计时间`, error: '点击右上角重新规划', empty: '先添加至少两个带坐标的地点', ready: '' }[routeStatus.value]))

function formatIsoDate(date: Date) { const pad = (value: number) => String(value).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` }
function destinationCover(key: string, coverUrl?: string) { return coverUrl || resolvedImages.value[key] || coverImages[key] || coverImages.default }
function placePhoto(item: PlanItem, index: number) {
  if (item.photo) return item.photo
  if (trip.value.coverKey !== 'hangzhou') return activeCover.value
  const key = index === 1 ? 'hangzhou-walk' : index === 2 ? 'hangzhou-food' : 'hangzhou-art'
  const fallback = index === 1 ? lakeWalkImage : index === 2 ? foodImage : artCampusImage
  return fallback
}
function placeAddress(item: PlanItem) { return item.address || item.subtitle || '地址待补充' }
function cityResultToDestination(result: CitySearchResult): DestinationTemplate {
  return {
    id: result.id, city: result.city, region: result.region, title: `${result.city}自由行`,
    description: result.photo ? '从城市地标开始规划旅程' : '发现这座城市值得去的地方',
    moodTitle: `下一站，去${result.city}`, moodCopy: '把想去的地点放进行程，再慢慢安排每一天。',
    travelTip: '地点和路线将根据高德的真实数据生成。', coverKey: result.id, coverUrl: result.photo,
    weather: '待查询', temperature: 0, dateRange: '日期待定', days: 3, nights: 2, schedule: []
  }
}
function openTripCreator(destination?: DestinationTemplate) {
  tripDetailOrigin.value = showTripList.value ? 'list' : 'home'
  showTripList.value = false
  showCreateTrip.value = true
  creationStep.value = destination ? 2 : 1
  selectedDestinations.value = destination ? [destination] : []
  cityDays.value = destination ? { [destination.id]: destination.days || 3 } : {}
  destinationQuery.value = ''
  creationDateMode.value = 'dates'
  creationStartDate.value = todayDate
  creationTitle.value = ''
}
function closeTripCreator() { showCreateTrip.value = false }
function selectedDestinationIndex(id: string) { return selectedDestinations.value.findIndex(destination => destination.id === id) }
async function toggleCreationDestination(destination: DestinationTemplate) {
  const index = selectedDestinationIndex(destination.id)
  if (index >= 0) { removeCreationDestination(destination.id); return }
  if (selectedDestinations.value.length >= 4) { uni.showToast({ title: '一次最多选择 4 座城市', icon: 'none' }); return }
  const selected = { ...destination }
  selectedDestinations.value.push(selected)
  cityDays.value = { ...cityDays.value, [destination.id]: Math.max(1, destination.days || 3) }
  destinationQuery.value = ''
  if (selected.coverUrl) {
    selected.coverUrl = await cacheRemoteImage(selected.coverUrl)
    selectedDestinations.value = selectedDestinations.value.map(item => item.id === selected.id ? selected : item)
  }
}
function removeCreationDestination(id: string) {
  selectedDestinations.value = selectedDestinations.value.filter(destination => destination.id !== id)
  const nextDays = { ...cityDays.value }
  delete nextDays[id]
  cityDays.value = nextDays
}
function changeCityDays(id: string, amount: -1 | 1) {
  const current = Number(cityDays.value[id] || 1)
  if (amount > 0 && plannedDays.value >= 30) return
  cityDays.value = { ...cityDays.value, [id]: Math.max(1, Math.min(14, current + amount)) }
}
function cityStartDay(index: number) { return selectedDestinations.value.slice(0, index).reduce((sum, destination) => sum + Number(cityDays.value[destination.id] || 1), 1) }
function cityEndDay(index: number) { const destination = selectedDestinations.value[index]; return cityStartDay(index) + Number(cityDays.value[destination.id] || 1) - 1 }
function handleStartDateChange(event: { detail: { value: string } }) { creationStartDate.value = event.detail.value }
function createPlannedTrip() {
  if (!selectedDestinations.value.length) return
  store.createTrip(selectedDestinations.value.map(destination => ({ destination, days: creationDateMode.value === 'dates' ? cityDays.value[destination.id] || 1 : 1 })), {
    startDate: creationDateMode.value === 'dates' ? creationStartDate.value : '',
    title: creationTitle.value
  })
  showCreateTrip.value = false
  uni.showToast({ title: '行程已创建', icon: 'success' })
}
function openTripList() { tripListTab.value = store.ongoingTrips.length ? 'ongoing' : store.upcomingTrips.length ? 'upcoming' : 'history'; showTripList.value = true }
function openPlannedTrip(item: PlannedTrip, origin: 'home' | 'list' = 'home') { tripDetailOrigin.value = origin; showTripList.value = false; store.selectTrip(item.id, '行程') }
function backFromTripDetail() { store.activeTab = '首页'; if (tripDetailOrigin.value === 'list') openTripList() }
function tripPlaceCount(item: PlannedTrip) { return item.schedule.reduce((total, day) => total + day.items.length, 0) }
function tripProgress(item: PlannedTrip) { return Math.round((item.schedule.filter(day => day.items.length).length / Math.max(1, item.days)) * 100) }
function tripStatusLabel(item: PlannedTrip) { return ({ ongoing: '进行中', upcoming: '待出发', draft: '日期待定', expired: '已结束' } as Record<TripStatus, string>)[store.getTripStatus(item)] }
function tripCardHint(item: PlannedTrip) {
  const status = store.getTripStatus(item)
  if (status === 'ongoing') return `旅行进行中 · ${tripPlaceCount(item)} 个地点`
  if (status === 'draft') return `${tripPlaceCount(item)} 个地点 · 日期待确定`
  const days = Math.max(1, Math.ceil((new Date(`${item.startDate}T00:00:00`).getTime() - new Date(`${todayDate}T00:00:00`).getTime()) / 86400000))
  return `${days} 天后出发 · ${tripPlaceCount(item)} 个地点`
}
function planningHint(item: PlannedTrip) {
  if (!item.startDate) return '日期待定 · 继续安排'
  const planned = item.schedule.filter(day => day.items.length).length
  if (!tripPlaceCount(item)) return '还没有添加地点'
  return `已安排 ${planned}/${item.schedule.length} 天`
}
function tripListCount(type: 'ongoing' | 'upcoming' | 'history') { return type === 'ongoing' ? store.ongoingTrips.length : type === 'upcoming' ? store.upcomingTrips.length : store.historyTrips.length }
function switchTab(tab: typeof tabs[number]) {
  if (tab === '行程') { openTripList(); return }
  showTripList.value = false
  showVisitedCities.value = false
  store.activeTab = tab
}
function addTripDay() { store.addDay(); uni.showToast({ title: '已增加一天', icon: 'none' }) }
function removeCurrentDay() {
  if (store.schedule.length <= 1) return
  const remove = () => {
    if (!store.removeDay()) { uni.showToast({ title: '每座城市至少保留一天', icon: 'none' }); return }
    uni.showToast({ title: '已删除当前天', icon: 'none' })
  }
  if (!store.currentDay.items.length) { remove(); return }
  uni.showModal({ title: '删除当前这一天？', content: `当天已有 ${store.currentDay.items.length} 个地点，删除后无法恢复。`, confirmColor: '#D85F50', success: ({ confirm }) => { if (confirm) remove() } })
}
function timePeriod(time: string) { return time === '待定' ? 'TIME' : Number(time.split(':')[0]) < 12 ? 'AM' : 'PM' }
function stayDuration(type: PlaceType) { return { 交通: '约 40 分钟', 景点: '建议 2 小时', 美食: '约 1 小时', 住宿: '已预订' }[type] }
function defaultDuration(type: PlaceType) { return { 交通: '30 分钟', 景点: '2 小时', 美食: '1 小时', 住宿: '全天' }[type] }
function segmentHint(index: number) { const base = routeMode.value === 'driving' ? 12 : routeMode.value === 'bicycling' ? 18 : 10; return `${routeModeLabel.value} ${base + index * 3} 分钟` }
function placeColor(type: PlaceType) { return placeTypes.find(item => item.value === type)?.color || '#2BB673' }
function resetPlaceForm() {
  placeForm.value = { title: '', address: '', note: '', photo: '', duration: '2 小时', time: '待定', type: '景点', latitude: undefined, longitude: undefined, poiId: '' }
  placeQuery.value = ''
  placeSearchResults.value = []
  selectedPoiId.value = ''
}
function openPlaceEditor(id?: number) {
  resetPlaceForm()
  editingPlaceId.value = id || null
  if (id) {
    const item = store.currentDay.items.find(place => place.id === id)
    if (item) {
      placeForm.value = { title: item.title, address: item.address || item.subtitle, note: item.note || '', photo: item.photo || placePhoto(item, store.currentDay.items.indexOf(item)), duration: item.duration || defaultDuration(item.type), time: item.time, type: item.type, latitude: item.latitude, longitude: item.longitude, poiId: item.poiId || `legacy-${item.id}` }
      selectedPoiId.value = item.poiId || `legacy-${item.id}`
    }
  }
  showPlaceEditor.value = true
}
function closePlaceEditor() { showPlaceEditor.value = false; editingPlaceId.value = null }
function handlePlaceTimeChange(event: { detail: { value: string } }) { placeForm.value.time = event.detail.value }
function handleDurationChange(event: { detail: { value: string | number } }) { placeForm.value.duration = durationOptions[Number(event.detail.value)] || durationOptions[0] }
function clearPlaceSearch() { placeQuery.value = ''; placeSearchResults.value = [] }
async function searchPlaces() {
  if (!placeQuery.value.trim() || placeSearching.value) return
  placeSearching.value = true
  try {
    placeSearchResults.value = await searchAmapPlaces(placeQuery.value, store.currentDay.city || trip.value.city.split(' → ')[0])
    if (!placeSearchResults.value.length) uni.showToast({ title: '没有找到相关地点，请换个关键词', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '地点搜索失败', icon: 'none' })
  } finally {
    placeSearching.value = false
  }
}
async function selectPlaceResult(result: PlaceSearchResult) {
  selectedPoiId.value = result.id
  const type = inferPlaceType(result.category)
  placeForm.value = { ...placeForm.value, title: result.name, address: result.address, photo: result.photo, duration: defaultDuration(type), type, longitude: result.longitude, latitude: result.latitude, poiId: result.id }
  placeSearchResults.value = []
  placeQuery.value = ''
  if (result.photo) placeForm.value.photo = await cacheRemoteImage(result.photo)
}
function inferPlaceType(category: string): PlaceType {
  if (/餐饮|美食|餐厅|小吃/u.test(category)) return '美食'
  if (/住宿|酒店|宾馆/u.test(category)) return '住宿'
  if (/交通|车站|机场|港口/u.test(category)) return '交通'
  return '景点'
}
function savePlace() {
  const form = placeForm.value
  if (!form.title.trim()) return
  const isEditing = Boolean(editingPlaceId.value)
  const changes: Omit<PlanItem, 'id'> = {
    time: form.time || '待定', title: form.title.trim(), subtitle: form.address.trim() || `${store.currentDay.city || trip.value.city} · 地址待补充`, address: form.address.trim(), note: form.note.trim(), photo: form.photo, duration: form.duration,
    type: form.type, amount: 0, color: placeColor(form.type), latitude: form.latitude, longitude: form.longitude, poiId: form.poiId || undefined
  }
  if (editingPlaceId.value) store.updatePlace(editingPlaceId.value, changes)
  else store.addPlace(changes)
  closePlaceEditor()
  uni.showToast({ title: isEditing ? '地点已更新' : '已添加到今天', icon: 'success' })
}
type PlaceTouchEvent = { touches?: ArrayLike<{ clientX: number; clientY: number }>; changedTouches?: ArrayLike<{ clientX: number; clientY: number }>; preventDefault?: () => void }
function touchY(event: PlaceTouchEvent) { return event.touches?.[0]?.clientY ?? event.changedTouches?.[0]?.clientY ?? 0 }
function touchX(event: PlaceTouchEvent) { return event.touches?.[0]?.clientX ?? event.changedTouches?.[0]?.clientX ?? 0 }
function swipeOffset(id: number) { return swipeOffsets.value[id] || 0 }
function rowShift(index: number) {
  if (dragSourceIndex < 0 || dragTargetIndex.value < 0 || !draggedRowHeight) return 0
  if (dragSourceIndex < dragTargetIndex.value && index > dragSourceIndex && index <= dragTargetIndex.value) return -draggedRowHeight
  if (dragSourceIndex > dragTargetIndex.value && index >= dragTargetIndex.value && index < dragSourceIndex) return draggedRowHeight
  return 0
}
function placeRowStyle(id: number, index: number) {
  if (draggingPlaceId.value === id) return { transform: `translateY(${dragOffset.value}px) scale(1.025)` }
  const shift = rowShift(index)
  return shift ? { transform: `translateY(${shift}px)` } : undefined
}
function startPlaceTouch(id: number, event: PlaceTouchEvent) {
  touchStartX = touchX(event)
  touchStartY = touchY(event)
  touchStartOffset = swipeOffset(id)
  touchMoved = false
  suppressCardTap = false
  swipeOffsets.value = Object.fromEntries(Object.entries(swipeOffsets.value).map(([key, value]) => [key, Number(key) === id ? value : 0]))
}
function startPlaceDrag(id: number, event: PlaceTouchEvent) {
  if (store.currentDay.items.length < 2) return
  draggingPlaceId.value = id
  suppressCardTap = true
  dragStartY = touchY(event)
  dragSourceIndex = store.currentDay.items.findIndex(item => item.id === id)
  dragTargetIndex.value = dragSourceIndex
  dragOffset.value = 0
  uni.createSelectorQuery().selectAll('.timeline-row').boundingClientRect((rects: unknown) => {
    dragRects = (rects as Array<{ top: number; bottom: number }>) || []
    const sourceRect = dragRects[dragSourceIndex]
    draggedRowHeight = sourceRect ? sourceRect.bottom - sourceRect.top : 0
  }).exec()
  try { uni.vibrateShort({ type: 'light' }) } catch {}
}
function applyDragPosition(y: number) {
  if (draggingPlaceId.value === null || !dragRects.length || dragSourceIndex < 0) return
  dragOffset.value = y - dragStartY
  const sourceRect = dragRects[dragSourceIndex]
  if (!sourceRect) return
  const draggedCenter = (sourceRect.top + sourceRect.bottom) / 2 + dragOffset.value
  let target = 0
  dragRects.forEach((rect, index) => { if (draggedCenter >= (rect.top + rect.bottom) / 2) target = index })
  dragTargetIndex.value = Math.max(0, Math.min(target, dragRects.length - 1))
}
function queueDragPosition(y: number) {
  pendingDragY = y
  if (dragFrameTimer) return
  dragFrameTimer = setTimeout(() => {
    dragFrameTimer = null
    applyDragPosition(pendingDragY)
  }, 16)
}
function movePlaceDrag(event: PlaceTouchEvent) {
  if (draggingPlaceId.value === null) return
  event.preventDefault?.()
  queueDragPosition(touchY(event))
}
function movePlaceTouch(id: number, event: PlaceTouchEvent) {
  if (draggingPlaceId.value) { movePlaceDrag(event); return }
  const deltaX = touchX(event) - touchStartX
  const deltaY = touchY(event) - touchStartY
  if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaX) < 5) return
  event.preventDefault?.()
  touchMoved = true
  suppressCardTap = true
  swipeOffsets.value = { ...swipeOffsets.value, [id]: Math.max(-82, Math.min(0, touchStartOffset + deltaX)) }
}
function endPlaceDrag() {
  const id = draggingPlaceId.value
  if (id === null) return
  if (dragFrameTimer) { clearTimeout(dragFrameTimer); dragFrameTimer = null; applyDragPosition(pendingDragY) }
  const target = dragTargetIndex.value
  const moved = dragSourceIndex >= 0 && target >= 0 && dragSourceIndex !== target
  if (moved) store.movePlaceTo(id, target)
  draggingPlaceId.value = null
  dragOffset.value = 0
  dragTargetIndex.value = -1
  dragSourceIndex = -1
  draggedRowHeight = 0
  pendingDragY = 0
  dragRects = []
  if (moved) {
    try { uni.vibrateShort({ type: 'light' }) } catch {}
    uni.showToast({ title: '顺序已保存', icon: 'none' })
  }
}
function endPlaceTouch(id: number) {
  if (draggingPlaceId.value) { endPlaceDrag(); return }
  if (touchMoved) swipeOffsets.value = { ...swipeOffsets.value, [id]: swipeOffset(id) < -38 ? -82 : 0 }
  setTimeout(() => { suppressCardTap = false }, 80)
}
function openPlaceFromCard(id: number) {
  if (suppressCardTap) return
  if (swipeOffset(id) < -5) { swipeOffsets.value = { ...swipeOffsets.value, [id]: 0 }; return }
  openingPlaceId.value = id
  try { uni.vibrateShort({ type: 'light' }) } catch {}
  setTimeout(() => { openingPlaceId.value = null; openPlaceEditor(id) }, 170)
}
function confirmDeletePlace(id: number) {
  uni.showModal({ title: '删除这个地点？', content: '删除后可以重新添加。', confirmColor: '#D85F50', success: ({ confirm }) => { if (!confirm) return; store.removePlace(id); swipeOffsets.value = {}; uni.showToast({ title: '已删除', icon: 'none' }) } })
}
function navigateTo(title: string) { const place = store.currentDay.items.find(item => item.title === title); if (place?.latitude != null && place.longitude != null) { uni.openLocation({ latitude: place.latitude, longitude: place.longitude, name: place.title, address: placeAddress(place), scale: 16 }); return } uni.showToast({ title: `暂时没有${title}的坐标`, icon: 'none' }) }
async function loadRoute() {
  const requestId = ++routeRequestId; routePoints.value = []; routeDistance.value = 0; routeDuration.value = 0
  if (mapPoints.value.length < 2) { routeStatus.value = 'empty'; return }
  if (!hasAmapKey()) { routeStatus.value = 'missing'; return }
  routeStatus.value = 'loading'
  try { const result = await planAmapRoute(mapPoints.value, routeMode.value); if (requestId !== routeRequestId) return; routePoints.value = result.points; routeDistance.value = result.distance; routeDuration.value = result.duration; routeStatus.value = 'ready' }
  catch (error) { if (requestId !== routeRequestId) return; routeStatus.value = 'error'; uni.showToast({ title: error instanceof Error ? error.message : '路线规划失败', icon: 'none' }) }
}
function selectMapPlace(id: number) { selectedPlaceId.value = id; const place = store.currentDay.items.find(item => item.id === id); if (place) uni.showToast({ title: place.title, icon: 'none' }) }
function handleMarkerTap(event: { detail: { markerId: number } }) { selectMapPlace(Number(event.detail.markerId)) }
function openProfileEditor() { profileDraft.value = { ...profile.value }; showProfileEditor.value = true }
function handleAgeChange(event: { detail: { value: string | number } }) { profileDraft.value.age = ageOptions[Number(event.detail.value)] || 1 }
function saveProfile() {
  const name = profileDraft.value.name.trim()
  if (!name) { uni.showToast({ title: '请输入用户名', icon: 'none' }); return }
  profile.value = { ...profileDraft.value, name }
  writeStorage('travel-user-profile', JSON.stringify(profile.value))
  showProfileEditor.value = false
  uni.showToast({ title: '资料已保存', icon: 'success' })
}
function toolAction(name: string) { uni.showToast({ title: `等待开发${name}`, icon: 'none' }) }
watch(destinationQuery, query => {
  if (citySearchTimer) clearTimeout(citySearchTimer)
  citySearchResults.value = []
  if (!query.trim()) { citySearching.value = false; return }
  citySearching.value = true
  citySearchTimer = setTimeout(async () => {
    try { citySearchResults.value = (await searchAmapCities(query)).map(cityResultToDestination) }
    catch (error) { uni.showToast({ title: error instanceof Error ? error.message : '城市搜索失败', icon: 'none' }) }
    finally { citySearching.value = false }
  }, 350)
})
watch(placeQuery, query => {
  if (placeSearchTimer) clearTimeout(placeSearchTimer)
  if (!query.trim()) { placeSearchResults.value = []; placeSearching.value = false; return }
  placeSearchTimer = setTimeout(searchPlaces, 350)
})
watch(() => [store.activeTab, store.activeDay, routeMode.value], () => { if (store.activeTab === '地图') loadRoute() }, { immediate: true })
onMounted(async () => { resolvedImages.value = await loadAmapDestinationPhotos() })
</script>

<style lang="scss" src="./index.scss"></style>
