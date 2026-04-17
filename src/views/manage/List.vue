<template>
	<div class="d-flex flex-column ga-6">
		
		<v-card rounded="xl" border>
			<v-card-text class="pa-7">
				<v-row align="center">
					<v-col cols="12" md="4">
						<v-tabs v-model="statusTab" color="primary" grow>					
							<v-tab value="active">已发布</v-tab>
							<v-tab value="draft">草稿箱</v-tab>
						</v-tabs>
					</v-col>

					<v-col cols="12" md="4">
						<v-text-field v-model="keyword" clearable density="comfortable" hide-details label="输入标题或关键词"
							prepend-inner-icon="mdi-magnify" variant="outlined" />
					</v-col>

					<v-col cols="12" md="4" class="d-flex justify-md-end">
						<v-btn color="primary" prepend-icon="mdi-pencil-box-outline" to="/write">新建日记</v-btn>
					</v-col>
				</v-row>
			</v-card-text>
		</v-card>

		<v-progress-linear v-if="loading" indeterminate color="primary" rounded />

		<v-row v-if="filteredItems.length" dense>
			<v-col v-for="item in filteredItems" :key="item.id" cols="12">
				<v-card rounded="xl" border class="diary-card" @click="openDetail(item.id)">
					<v-card-item class="pa-7">
						<v-card-title class="font-weight-bold">{{ item.title || (statusTab === 'draft' ? '未命名草稿' : '无标题日记') }}</v-card-title>
						<v-card-subtitle>
							{{ diaryTimeText(item) }}
						</v-card-subtitle>

						<template #append>
							<div class="d-flex flex-wrap ga-2 justify-end">
								<v-chip color="secondary" variant="tonal">{{ visibilityText(item.visibility) }}</v-chip>
								<v-chip :color="statusTab === 'draft' ? 'warning' : 'success'" variant="tonal">
									{{ statusTab === 'draft' ? '草稿' : '已发布' }}
								</v-chip>
							</div>
						</template>
					</v-card-item>

					<v-card-text class="pt-0 px-7 pb-7">
						<div class="text-body-1" :class="{ 'text-medium-emphasis': isDraftWithoutContent(item) }">
							{{ getCardPreviewText(item) }}
						</div>

						<div v-if="extractCardImages(item).length" class="d-flex flex-wrap mt-4" style="gap: 50px;">
							<v-sheet v-for="(image, index) in extractCardImages(item)" :key="`${item.id}-${index}-${image.raw}`"
								border height="150" rounded width="150">
								<v-img :src="image.url" cover height="150" width="150">
									<template #error>
										<div
											class="d-flex align-center justify-center fill-height text-caption text-medium-emphasis text-center px-2">
											加载失败
										</div>
									</template>
								</v-img>
							</v-sheet>
						</div>
						<div v-if="statusTab === 'active'" class="d-flex flex-wrap ga-3 mt-4 text-body-2 text-medium-emphasis">
							<span>点赞 {{ item.like_count ?? 0 }}</span>
							<span>评论 {{ item.comment_count ?? 0 }}</span>
						</div>
					</v-card-text>

					<v-card-actions class="px-4 pb-4">
						<v-btn variant="text" prepend-icon="mdi-pencil-outline" @click.stop="openEditor(item.id)">继续编辑</v-btn>
						<v-btn v-if="statusTab === 'draft'" color="primary" variant="text" prepend-icon="mdi-send-outline"
							@click.stop="openEditor(item.id)">
							去发布
						</v-btn>
						<v-spacer />
						<v-btn color="error" variant="tonal" prepend-icon="mdi-delete-outline"
							@click.stop="openDeleteDialog(item)">删除</v-btn>
					</v-card-actions>
				</v-card>
			</v-col>
		</v-row>

		<v-card v-else rounded="xl" border>
			<v-card-text class="pa-7 text-center">
				<div class="text-h6 font-weight-bold">{{ statusTab === 'draft' ? '草稿箱是空的' : '还没有发布内容' }}</div>
				<v-btn class="mt-5" color="primary" to="/write">去写日记</v-btn>
			</v-card-text>
		</v-card>

		<div class="d-flex justify-center">
			<v-pagination v-if="total > diaryPageSize" v-model="page" :length="Math.ceil(total / diaryPageSize)"
				rounded="circle" />
		</div>

		<v-dialog v-model="deleteDialog" max-width="420">
			<v-card rounded="xl">
				<v-card-title>确认删除</v-card-title>
				<v-card-text class="pa-7">
					是否删除当前{{ statusTab === 'draft' ? '草稿' : '日记' }}？
				</v-card-text>
				<v-card-actions class="px-6 pb-5">
					<v-spacer />
					<v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
					<v-btn color="error" :loading="deleting" @click="handleDelete">确认</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { API_BASE_URL, DIARY_PAGE_SIZE_OPTIONS, VISIBILITY_OPTIONS } from '@/constants/app'
import { deleteDiary, listDiaries } from '@/services/api'
import { usePreferencesStore } from '@/stores/preferences'
import { getDiaryPrimaryTime, summarizeText } from '@/utils/format'

const router = useRouter()
const SnackBar = inject('snack', null)
const preferencesStore = usePreferencesStore()
const { diaryPageSize } = storeToRefs(preferencesStore)

const loading = ref(false)
const deleting = ref(false)
const deleteDialog = ref(false)
const pendingItem = ref(null)
const items = ref([])
const total = ref(0)
const page = ref(1)
const statusTab = ref('draft')
const visibility = ref('all')
const keyword = ref('')

const visibilityOptions = [{ title: '全部可见性', value: 'all' }, ...VISIBILITY_OPTIONS]

const filteredItems = computed(() => {
	const currentKeyword = keyword.value.trim().toLowerCase()

	if (!currentKeyword) {
		return items.value
	}

	return items.value.filter((item) => {
		const text = `${item.title || ''} ${item.summary || ''} ${item.content || ''}`.toLowerCase()
		return text.includes(currentKeyword)
	})
})

watch([statusTab, visibility, diaryPageSize], () => {
	page.value = 1
})

watch([statusTab, visibility, page, diaryPageSize], () => {
	loadList()
}, { immediate: true })

function visibilityText(value) {
	return visibilityOptions.find((item) => item.value === value)?.title || value || '未设置'
}

function diaryTimeText(item) {
	const timeInfo = getDiaryPrimaryTime(item?.created_at, item?.updated_at)
	return `${timeInfo.label}${timeInfo.value}`
}

function isDraftWithoutContent(item) {
	if (statusTab.value !== 'draft') {
		return false
	}

	return !String(item?.content || '').trim()
}

function getCardPreviewText(item) {
	if (isDraftWithoutContent(item)) {
		return '（这一天还没有写下文字）'
	}

	return summarizeText(item?.summary || item?.content, 180)
}

function openDeleteDialog(item) {
	pendingItem.value = item
	deleteDialog.value = true
}

function openDetail(itemId) {
	router.push(`/diary/detail/${itemId}`)
}

function openEditor(itemId) {
	router.push(`/write/${itemId}`)
}

function parseImagesField(images) {
	if (!images) {
		return []
	}

	let parsed = images

	if (typeof parsed === 'string') {
		try {
			parsed = JSON.parse(parsed)
		} catch {
			parsed = [parsed]
		}
	}

	if (!Array.isArray(parsed)) {
		return []
	}

	return parsed
}

function resolveImageUrl(raw) {
	const value = String(raw || '').trim()

	if (!value) {
		return ''
	}

	if (/^https?:\/\//i.test(value) || /^blob:/i.test(value) || /^data:/i.test(value)) {
		return value
	}

	if (value.startsWith('/')) {
		return `${API_BASE_URL}${value}`
	}

	return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`
}

function extractCardImages(item) {
	const parsedImages = parseImagesField(item?.images)

	return parsedImages
		.map((image) => {
			const raw = typeof image === 'string'
				? image
				: image?.url || image?.src || image?.filename || ''

			const url = resolveImageUrl(raw)

			if (!url) {
				return null
			}

			return {
				raw,
				url
			}
		})
		.filter(Boolean)
		.slice(0, 3)
}

async function loadList() {
	loading.value = true

	try {
		const data = await listDiaries({
			pn: page.value,
			ps: diaryPageSize.value,
			visibility: visibility.value,
			status: statusTab.value
		})

		items.value = data.lists || []
		total.value = data.total || 0
	} catch (error) {
		SnackBar?.({
			text: error.message || '获取管理列表失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		loading.value = false
	}
}

async function handleDelete() {
	if (!pendingItem.value) {
		return
	}

	deleting.value = true

	try {
		await deleteDiary(pendingItem.value.id)
		SnackBar?.({
			text: '删除成功',
			color: 'success',
			icon: 'mdi-check-circle-outline'
		})
		deleteDialog.value = false
		pendingItem.value = null
		await loadList()
	} catch (error) {
		SnackBar?.({
			text: error.message || '删除失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		deleting.value = false
	}
}
</script>

<style scoped>
.diary-card {
	cursor: pointer;
}
</style>
