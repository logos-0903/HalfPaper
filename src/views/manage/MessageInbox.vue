<template>
	<div class="d-flex flex-column ga-6">

		<v-row dense>
			<v-col cols="12" md="4">
				<v-sheet border rounded="xl" class="pa-5 h-100">
					<div class="text-caption text-medium-emphasis">全部未读</div>
					<div class="text-h4 font-weight-bold mt-2">{{ unreadCounts.all }}</div>
				</v-sheet>
			</v-col>
			<v-col cols="12" md="4">
				<v-sheet border rounded="xl" class="pa-5 h-100">
					<div class="text-caption text-medium-emphasis">互动消息</div>
					<div class="text-h4 font-weight-bold mt-2">{{ unreadCounts.interaction }}</div>
				</v-sheet>
			</v-col>
			<v-col cols="12" md="4">
				<v-sheet border rounded="xl" class="pa-5 h-100">
					<div class="text-caption text-medium-emphasis">系统消息</div>
					<div class="text-h4 font-weight-bold mt-2">{{ unreadCounts.system }}</div>
				</v-sheet>
			</v-col>
		</v-row>

		<v-card rounded="xl" border>
			<v-card-text class="pa-7">
				<v-row align="center">
					<v-col cols="12" md="4">
						<v-select
							v-model="messageCategory"
							:items="messageCategoryItems"
							density="comfortable"
							hide-details
							label="消息分类"
							variant="outlined"
						/>
					</v-col>
					<v-col cols="12" md="4">
						<v-select
							v-model="messagePageSize"
							:items="messagePageSizeOptions"
							density="comfortable"
							hide-details
							label="每页数量"
							variant="outlined"
						/>
					</v-col>
					<v-col cols="12" md="4" class="d-flex flex-wrap justify-md-end ga-2">
						<v-btn variant="outlined" prepend-icon="mdi-refresh" :loading="loadingUnreadCounts || messageLoading" @click="refreshAll">刷新</v-btn>
						<v-btn color="primary" prepend-icon="mdi-email-check-outline" :disabled="!hasUnreadMessages" :loading="markingAllMessages" @click="handleReadAllMessages">
							全部已读
						</v-btn>
					</v-col>
				</v-row>
			</v-card-text>
		</v-card>

		<v-progress-linear v-if="messageLoading" indeterminate color="primary" rounded />

		<v-row v-if="messageItems.length" dense>
			<v-col v-for="item in messageItems" :key="item.id" cols="12">
				<v-card rounded="xl" border>
					<v-card-item class="pa-6 pb-3">
						<v-card-title class="d-flex flex-wrap align-center ga-2">
							<span>{{ item.title || '通知' }}</span>
							<v-chip size="small" variant="tonal" :color="item.category === 'system' ? 'warning' : 'primary'">
								{{ item.category === 'system' ? '系统' : '互动' }}
							</v-chip>
							<v-chip v-if="!isMessageRead(item)" size="small" color="error" variant="tonal">未读</v-chip>
						</v-card-title>
						<v-card-subtitle>
							{{ formatDate(item.created_at || item.timestamp || Date.now()) }}
						</v-card-subtitle>
					</v-card-item>

					<v-card-text class="pt-0 px-6 pb-4">
						<div class="text-body-1">{{ item.content || '暂无内容' }}</div>
					</v-card-text>

					<v-card-actions class="px-4 pb-4">
						<v-btn v-if="!isMessageRead(item)" variant="text" prepend-icon="mdi-check" :loading="markingMessageId === item.id" @click="handleReadMessage(item)">
							标记已读
						</v-btn>
						<span v-else class="text-caption text-medium-emphasis ml-2">已读</span>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row>

		<v-card v-else rounded="xl" border>
			<v-card-text class="pa-7 text-center text-medium-emphasis">暂无消息</v-card-text>
		</v-card>

		<div class="d-flex justify-center">
			<PaginationBar
				v-if="messageTotal > 0"
				v-model="messagePage"
				:disabled="messageLoading"
				:page-size="messagePageSize"
				:total="messageTotal"
			/>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue'
import PaginationBar from '@/components/PaginationBar.vue'
import { DIARY_PAGE_SIZE_OPTIONS } from '@/constants/app'
import { getUnreadMessageCount, listMessages, markAllMessagesRead, markMessageRead } from '@/services/api'
import { formatDate } from '@/utils/format'

const SnackBar = inject('snack', null)

const loadingUnreadCounts = ref(false)
const messageLoading = ref(false)
const markingAllMessages = ref(false)
const markingMessageId = ref('')
const messageItems = ref([])
const messageTotal = ref(0)
const messagePage = ref(1)
const messagePageSize = ref(20)
const messageCategory = ref('all')

const unreadCounts = reactive({
	all: 0,
	interaction: 0,
	system: 0
})

const messageCategoryItems = [
	{ title: '全部消息', value: 'all' },
	{ title: '互动消息', value: 'interaction' },
	{ title: '系统消息', value: 'system' }
]
const messagePageSizeOptions = DIARY_PAGE_SIZE_OPTIONS

const hasUnreadMessages = computed(() => Number(unreadCounts.all || 0) > 0)

onMounted(() => {
	loadUnreadCounts()
	loadMessages()
})

watch([messageCategory, messagePage, messagePageSize], () => {
	loadMessages()
})

function showSnack(payload) {
	SnackBar?.(payload)
}

function isMessageRead(item) {
	if (typeof item?.is_read === 'boolean') {
		return item.is_read
	}

	if (typeof item?.isRead === 'boolean') {
		return item.isRead
	}

	if (typeof item?.read === 'boolean') {
		return item.read
	}

	return Boolean(item?.read_at || item?.readAt)
}

async function loadUnreadCounts() {
	loadingUnreadCounts.value = true
	try {
		const data = await getUnreadMessageCount()
		unreadCounts.all = Number(data?.all || 0)
		unreadCounts.interaction = Number(data?.interaction || 0)
		unreadCounts.system = Number(data?.system || 0)
	} catch {
		// silently fail
	} finally {
		loadingUnreadCounts.value = false
	}
}

async function loadMessages() {
	messageLoading.value = true

	try {
		const data = await listMessages({
			category: messageCategory.value,
			page: messagePage.value,
			page_size: messagePageSize.value
		})

		messageItems.value = Array.isArray(data?.list) ? data.list : []
		messageTotal.value = Number(data?.pagination?.total || 0)
	} catch (error) {
		showSnack({
			text: error.message || '获取消息列表失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		messageLoading.value = false
	}
}

async function refreshAll() {
	loadUnreadCounts()
	await loadMessages()
}

async function handleReadMessage(item) {
	if (!item?.id) {
		return
	}

	markingMessageId.value = item.id

	try {
		await markMessageRead(item.id)
		item.is_read = true
		showSnack({
			text: '消息状态已更新',
			color: 'success',
			icon: 'mdi-check-circle-outline'
		})
		loadUnreadCounts()
	} catch (error) {
		showSnack({
			text: error.message || '更新消息状态失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		markingMessageId.value = ''
	}
}

async function handleReadAllMessages() {
	markingAllMessages.value = true

	try {
		await markAllMessagesRead(messageCategory.value === 'all' ? undefined : messageCategory.value)
		showSnack({
			text: '已批量标记消息为已读',
			color: 'success',
			icon: 'mdi-check-circle-outline'
		})
		loadUnreadCounts()
		await loadMessages()
	} catch (error) {
		showSnack({
			text: error.message || '批量已读失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		markingAllMessages.value = false
	}
}
</script>

<style scoped>
</style>
