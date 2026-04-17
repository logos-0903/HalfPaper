<template>
<div class="d-flex flex-column ga-6">

	<v-card rounded="xl" border>
		<v-card-text class="pa-7">
			<v-row align="center">
				<v-col cols="12" md="3">
					<v-select
						:model-value="diaryPageSize"
						:items="DIARY_PAGE_SIZE_OPTIONS"
						density="comfortable"
						hide-details
						label="每页数量"
						variant="outlined"
						@update:model-value="changeDiaryPageSize"
					/>
				</v-col>

				<v-col cols="12" md="9">
					<v-text-field
						v-model="keyword"
						clearable
						density="comfortable"
						hide-details
						label="输入标题或关键词"
						prepend-inner-icon="mdi-magnify"
						variant="outlined"
					/>
				</v-col>
			</v-row>

			<v-row align="center" class="mt-1">
				<v-col cols="12" md="4">
					<v-tabs v-model="statusTab" color="primary" grow>
						<v-tab value="active">已发布</v-tab>
						<v-tab value="draft">草稿箱</v-tab>
					</v-tabs>
				</v-col>
				<v-col cols="12" md="4">
					<v-select
						v-model="visibility"
						:items="visibilityOptions"
						density="comfortable"
						hide-details
						label="可见性"
						variant="outlined"
					/>
				</v-col>
				<v-col cols="12" md="4" class="d-flex justify-md-end">
					<v-btn color="primary"  to="/write">新建日记</v-btn>
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
							<template v-if="statusTab === 'draft'">
								<v-chip color="secondary" variant="tonal">仅自己可见</v-chip>
								<v-chip color="warning" variant="tonal">草稿</v-chip>
							</template>
							<template v-else-if="item.visibility === 'public'">
								<v-chip color="success" variant="tonal">公开</v-chip>
								<v-chip color="success" variant="tonal">已发布</v-chip>
							</template>
							<template v-else>
								<v-chip color="secondary" variant="tonal">仅自己可见</v-chip>
								<v-chip color="success" variant="tonal">已发布</v-chip>
							</template>
						</div>
					</template>
				</v-card-item>

				<v-card-text class="pt-3 px-7 pb-7">
					<div class="text-body-1" :class="{ 'text-medium-emphasis': isDraftWithoutContent(item) }">
						{{ getCardPreviewText(item) }}
					</div>

					<div v-if="extractCardImages(item).length" class="d-flex flex-wrap mt-4" style="gap: 8px;">
						<div
							v-for="(image, index) in extractCardImages(item)"
							:key="`${item.id}-${index}-${image.raw}`"
							class="preview-image-wrapper"
						>
							<v-sheet border rounded width="120" height="120">
								<v-img :src="image.url" cover height="120" width="120">
									<template #error>
										<div class="d-flex align-center justify-center fill-height text-caption text-medium-emphasis text-center px-2">加载失败</div>
									</template>
								</v-img>
							</v-sheet>
							<div v-if="index === 2 && extraImageCount(item) > 0" class="preview-image-overlay d-flex align-center justify-center">
								<span class="text-h6 font-weight-bold text-white">+{{ extraImageCount(item) }}</span>
							</div>
						</div>
					</div>
					<div v-if="statusTab === 'active'" class="d-flex flex-wrap mt-6 text-body-2 text-medium-emphasis" style="gap: 20px;">
						<div class="d-flex align-center" style="gap: 6px;">
							<v-icon size="16">mdi-thumb-up-outline</v-icon>
							<span>{{ item.like_count ?? 0 }}</span>
						</div>
						<div class="d-flex align-center" style="gap: 6px;">
							<v-icon size="16">mdi-comment-outline</v-icon>
							<span>{{ item.comment_count ?? 0 }}</span>
						</div>
						<div class="d-flex align-center" style="gap: 6px;">
							<v-icon size="16">mdi-bookmark-outline</v-icon>
							<span>{{ item.favorite_count ?? 0 }}</span>
						</div>
					</div>
				</v-card-text>

				<v-card-actions class="px-4 pb-4">
					<v-btn variant="text" :prepend-icon="statusTab === 'draft' ? 'mdi-pencil-outline' : 'mdi-update'" @click.stop="openEditor(item.id)">{{ statusTab === 'draft' ? '继续编辑' : '更新' }}</v-btn>
					<v-btn v-if="statusTab === 'draft'" color="primary" variant="text" prepend-icon="mdi-send-outline" @click.stop="openEditor(item.id)">
						去发布
					</v-btn>
					<v-spacer />
					<v-btn color="error" variant="tonal" prepend-icon="mdi-delete-outline" @click.stop="openDeleteDialog(item)">删除</v-btn>
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
		<PaginationBar
			v-if="total > 0"
			v-model="page"
			:disabled="loading"
			:page-size="diaryPageSize"
			:total="total"
		/>
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
import PaginationBar from '@/components/PaginationBar.vue'
import { DIARY_PAGE_SIZE_OPTIONS, VISIBILITY_OPTIONS } from '@/constants/app'
import { deleteDiary, listDiaries } from '@/services/api'
import { usePreferencesStore } from '@/stores/preferences'
import { getDiaryPrimaryTime, summarizeText } from '@/utils/format'
import { extractCardImages, extraImageCount } from '@/utils/image'

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
const statusTab = ref('active')
const visibility = ref('all')
const keyword = ref('')

const visibilityOptions = [{ title: '全部可见性', value: 'all' }, ...VISIBILITY_OPTIONS]

const filteredItems = computed(() => {
	const currentKeyword = String(keyword.value || '').trim().toLowerCase()

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

function showSnack(payload) {
	SnackBar?.(payload)
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

function changeDiaryPageSize(value) {
	const nextValue = Number(value)

	if (!Number.isFinite(nextValue) || nextValue <= 0) {
		return
	}

	preferencesStore.setDiaryPageSize(nextValue)
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

		items.value = data?.lists || []
		total.value = Number(data?.total || 0)
	} catch (error) {
		showSnack({
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
		showSnack({
			text: '删除成功',
			color: 'success',
			icon: 'mdi-check-circle-outline'
		})
		deleteDialog.value = false
		pendingItem.value = null
		await loadList()
	} catch (error) {
		showSnack({
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

.preview-image-wrapper {
	position: relative;
	border-radius: 8px;
	overflow: hidden;
}

.preview-image-overlay {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	border-radius: 8px;
}
</style>
