<template>
	<div class="d-flex flex-column ga-6">
		<v-row dense>
			<v-col cols="12" lg="6">
				<v-card rounded="xl" border class="h-100">
					<v-card-item class="pa-6 pb-4">
						<v-card-title class="d-flex align-center ga-2">
							<v-icon size="20">mdi-bell-outline</v-icon>
							系统通知
						</v-card-title>
						<v-card-subtitle>给全体用户或指定用户发送系统消息</v-card-subtitle>
					</v-card-item>
					<v-card-text class="px-6 pb-6 pt-0 d-flex flex-column ga-4">
						<v-select
							v-model="systemMessageForm.targetType"
							:items="systemMessageTargetItems"
							density="comfortable"
							hide-details
							label="发送范围"
							variant="outlined"
						/>
						<v-text-field
							v-if="systemMessageForm.targetType === 'user'"
							v-model="systemMessageForm.userId"
							density="comfortable"
							hide-details
							label="目标用户 UUID"
							prepend-inner-icon="mdi-account-outline"
							variant="outlined"
						/>
						<v-text-field
							v-model="systemMessageForm.title"
							density="comfortable"
							hide-details
							label="消息标题"
							prepend-inner-icon="mdi-format-title"
							variant="outlined"
						/>
						<v-textarea
							v-model="systemMessageForm.content"
							auto-grow
							hide-details
							label="消息内容"
							rows="4"
							variant="outlined"
						/>
						<div class="d-flex justify-end">
							<v-btn color="primary" :loading="sendingSystemMessage" @click="handleSendSystemMessage">
								发送通知
							</v-btn>
						</div>
					</v-card-text>
				</v-card>
			</v-col>

			<v-col cols="12" lg="6">
				<v-card rounded="xl" border class="h-100">
					<v-card-item class="pa-6 pb-4">
						<v-card-title class="d-flex align-center ga-2">
							<v-icon size="20">mdi-eye-off-outline</v-icon>
							内容隐藏
						</v-card-title>
						<v-card-subtitle>输入日记 ID 读取评论并执行隐藏操作</v-card-subtitle>
					</v-card-item>
					<v-card-text class="px-6 pb-6 pt-0 d-flex flex-column ga-4">
						<v-text-field
							v-model="adminDiaryIdInput"
							density="comfortable"
							hide-details
							label="输入公开日记 UUID"
							prepend-inner-icon="mdi-note-search-outline"
							variant="outlined"
						/>
						<v-alert type="info" variant="tonal" rounded="lg" density="compact" text="隐藏帖子会通知作者；隐藏一级评论会连同整个评论区一起隐藏。" />
						<div class="d-flex flex-wrap ga-2 justify-end">
							<v-btn variant="outlined" prepend-icon="mdi-refresh" :loading="adminFeedLoading" @click="loadAdminFeed">刷新公开内容</v-btn>
							<v-btn color="primary" :loading="adminCommentsLoading" @click="handleSelectDiaryForModeration">
								查看评论
							</v-btn>
						</div>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<v-card rounded="xl" border>
			<v-card-item class="pa-6 pb-4">
				<v-card-title class="d-flex align-center ga-2">
					<v-icon size="20">mdi-note-multiple-outline</v-icon>
					最近公开帖子
				</v-card-title>
			</v-card-item>
			<v-progress-linear v-if="adminFeedLoading" indeterminate color="primary" rounded />
			<v-card-text v-else-if="adminDiaries.length" class="px-6 pb-6 pt-0">
				<v-row dense>
					<v-col v-for="item in adminDiaries" :key="`admin-diary-${item.id}`" cols="12" md="6">
						<v-card rounded="xl" border variant="outlined" class="h-100">
							<v-card-item class="pa-5 pb-3">
								<v-card-title class="text-subtitle-1 font-weight-bold">{{ item.title || '无标题公开帖子' }}</v-card-title>
								<v-card-subtitle>{{ formatDate(item.published_at || item.created_at) }}</v-card-subtitle>
							</v-card-item>
							<v-card-text class="pt-0 px-5 pb-4 d-flex flex-column ga-3">
								<div class="text-body-2">{{ summarizeText(item.summary || item.content, 120) }}</div>
								<div class="d-flex flex-wrap ga-4 text-caption text-medium-emphasis">
									<span>作者：{{ item.author?.username || '未知用户' }}</span>
									<span>评论 {{ item.comment_count ?? 0 }}</span>
									<span>收藏 {{ item.favorite_count ?? 0 }}</span>
								</div>
								<div class="text-caption text-medium-emphasis" style="word-break: break-all;">ID: {{ item.id }}</div>
							</v-card-text>
							<v-card-actions class="px-4 pb-4">
								<v-btn size="small" variant="text" prepend-icon="mdi-comment-search-outline" @click="selectModerationDiary(item.id)">查看评论</v-btn>
								<v-spacer />
								<v-btn size="small" color="error" variant="tonal" prepend-icon="mdi-eye-off-outline" @click="openModerationDialog('diary', item.id, item.title || item.id)">
									隐藏帖子
								</v-btn>
							</v-card-actions>
						</v-card>
					</v-col>
				</v-row>
			</v-card-text>
			<v-card-text v-else class="pa-7 text-center text-medium-emphasis">暂无可审核的公开帖子</v-card-text>
		</v-card>

		<v-card rounded="xl" border>
			<v-card-item class="pa-6 pb-4">
				<v-card-title class="d-flex align-center ga-2">
					<v-icon size="20">mdi-comment-check-outline</v-icon>
					评论审核
				</v-card-title>
				<v-card-subtitle>
					{{ selectedModerationDiaryId ? `当前日记：${selectedModerationDiary?.title || selectedModerationDiaryId}` : '选择一篇公开帖子后加载评论' }}
				</v-card-subtitle>
			</v-card-item>

			<v-progress-linear v-if="adminCommentsLoading" indeterminate color="primary" rounded />

			<v-card-text v-else-if="selectedModerationDiaryId && adminCommentRoots.length" class="px-6 pb-6 pt-0 d-flex flex-column ga-4">
				<div v-for="root in adminCommentRoots" :key="root.id" class="comment-thread d-flex flex-column ga-3">
					<div class="comment-card-root pa-4 rounded-lg border">
						<div class="d-flex flex-wrap justify-space-between ga-3">
							<div class="d-flex flex-column ga-1">
								<div class="text-subtitle-1 font-weight-medium">{{ getCommentAuthorName(root) }}</div>
								<div class="text-caption text-medium-emphasis">{{ formatDate(root.created_at) }}</div>
								<div class="text-caption text-medium-emphasis" style="word-break: break-all;">{{ root.id }}</div>
							</div>
							<v-btn color="error" variant="tonal" size="small" prepend-icon="mdi-eye-off-outline" @click="openModerationDialog('comment', root.id, root.content)">
								隐藏评论树
							</v-btn>
						</div>
						<div class="text-body-1 mt-3">{{ root.content || '无内容' }}</div>
						<div class="d-flex flex-wrap ga-4 mt-3 text-caption text-medium-emphasis">
							<span>点赞 {{ root.like_count ?? 0 }}</span>
							<span>回复 {{ root.rcount ?? 0 }}</span>
						</div>
					</div>

					<div v-if="Array.isArray(root.replies) && root.replies.length" class="d-flex flex-column ga-2 pl-md-6">
						<div v-for="reply in root.replies" :key="reply.id" class="comment-card-child pa-4 rounded-lg border">
							<div class="d-flex flex-wrap justify-space-between ga-3">
								<div class="d-flex flex-column ga-1">
									<div class="text-subtitle-2 font-weight-medium">{{ getCommentAuthorName(reply) }}</div>
									<div class="text-caption text-medium-emphasis">{{ formatDate(reply.created_at) }}</div>
								</div>
								<v-btn size="small" color="error" variant="text" prepend-icon="mdi-eye-off-outline" @click="openModerationDialog('comment', reply.id, reply.content)">
									隐藏回复
								</v-btn>
							</div>
							<div class="text-body-2 mt-3">{{ reply.content || '无内容' }}</div>
						</div>
					</div>
				</div>

				<div class="d-flex justify-center pt-2">
					<PaginationBar
						v-if="adminCommentPagination.total > 0"
						v-model="adminCommentPage"
						:disabled="adminCommentsLoading"
						:page-size="adminCommentPageSize"
						:total="adminCommentPagination.total"
					/>
				</div>
			</v-card-text>

			<v-card-text v-else class="pa-7 text-center text-medium-emphasis">
				{{ selectedModerationDiaryId ? '当前帖子暂无评论或评论不可见。' : '请先选择帖子，再读取评论列表。' }}
			</v-card-text>
		</v-card>

		<v-dialog v-model="moderationDialog.visible" max-width="520">
			<v-card rounded="xl">
				<v-card-title>{{ moderationDialog.type === 'diary' ? '隐藏帖子' : '隐藏评论' }}</v-card-title>
				<v-card-text class="pa-7 d-flex flex-column ga-4">
					<div class="text-body-2 text-medium-emphasis">目标：{{ moderationDialog.targetTitle }}</div>
					<v-textarea
						v-model="moderationDialog.reason"
						auto-grow
						hide-details
						label="隐藏原因"
						rows="4"
						variant="outlined"
					/>
				</v-card-text>
				<v-card-actions class="px-6 pb-5">
					<v-spacer />
					<v-btn variant="text" @click="closeModerationDialog">取消</v-btn>
					<v-btn color="error" :loading="moderationDialog.pending" @click="handleSubmitModeration">确认隐藏</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from 'vue'
import PaginationBar from '@/components/PaginationBar.vue'
import {
	hideCommentByAdmin,
	hideDiaryByAdmin,
	listComments,
	listFireflies,
	sendSystemMessage
} from '@/services/api'
import { formatDate, summarizeText } from '@/utils/format'

const SnackBar = inject('snack', null)

const adminFeedLoading = ref(false)
const adminCommentsLoading = ref(false)
const sendingSystemMessage = ref(false)
const adminDiaries = ref([])
const adminDiaryIdInput = ref('')
const selectedModerationDiaryId = ref('')
const adminCommentRoots = ref([])
const adminCommentPage = ref(1)
const adminCommentPageSize = ref(20)
const adminCommentPagination = reactive({
	page: 1,
	page_size: 20,
	total: 0,
	total_pages: 1
})

const systemMessageForm = reactive({
	targetType: 'all',
	userId: '',
	title: '',
	content: ''
})

const moderationDialog = reactive({
	visible: false,
	type: 'diary',
	targetId: '',
	targetTitle: '',
	reason: '',
	pending: false
})

const systemMessageTargetItems = [
	{ title: '全体用户', value: 'all' },
	{ title: '指定用户', value: 'user' }
]

const selectedModerationDiary = computed(() => {
	return adminDiaries.value.find((item) => item.id === selectedModerationDiaryId.value) || null
})

watch([adminCommentPage, adminCommentPageSize], () => {
	if (selectedModerationDiaryId.value) {
		loadAdminComments(selectedModerationDiaryId.value)
	}
})

function showSnack(payload) {
	SnackBar?.(payload)
}

function getCommentAuthorName(comment) {
	return comment?.member?.username || comment?.member?.id || '匿名用户'
}

async function loadAdminFeed() {
	adminFeedLoading.value = true

	try {
		const data = await listFireflies({
			pn: 1,
			ps: 6,
			sort: 'latest'
		})

		adminDiaries.value = Array.isArray(data?.lists) ? data.lists : []
	} catch (error) {
		showSnack({
			text: error.message || '获取公开帖子失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		adminFeedLoading.value = false
	}
}

function selectModerationDiary(diaryId) {
	if (!diaryId) {
		return
	}

	adminDiaryIdInput.value = diaryId
	selectedModerationDiaryId.value = diaryId
	adminCommentPage.value = 1
	loadAdminComments(diaryId)
}

function handleSelectDiaryForModeration() {
	const diaryId = String(adminDiaryIdInput.value || '').trim()

	if (!diaryId) {
		showSnack({
			text: '请先输入日记 ID',
			color: 'warning',
			icon: 'mdi-alert-circle-outline'
		})
		return
	}

	selectModerationDiary(diaryId)
}

async function loadAdminComments(diaryId) {
	if (!diaryId) {
		adminCommentRoots.value = []
		adminCommentPagination.total = 0
		return
	}

	adminCommentsLoading.value = true

	try {
		const data = await listComments({
			diary_id: diaryId,
			page: adminCommentPage.value,
			page_size: adminCommentPageSize.value
		})

		adminCommentRoots.value = Array.isArray(data?.replies) ? data.replies : []
		adminCommentPagination.page = Number(data?.pagination?.page || adminCommentPage.value)
		adminCommentPagination.page_size = Number(data?.pagination?.page_size || adminCommentPageSize.value)
		adminCommentPagination.total = Number(data?.pagination?.total || 0)
		adminCommentPagination.total_pages = Number(data?.pagination?.total_pages || 1)
	} catch (error) {
		adminCommentRoots.value = []
		adminCommentPagination.total = 0
		showSnack({
			text: error.message || '获取评论失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		adminCommentsLoading.value = false
	}
}

function openModerationDialog(type, targetId, targetTitle) {
	moderationDialog.visible = true
	moderationDialog.type = type
	moderationDialog.targetId = targetId
	moderationDialog.targetTitle = targetTitle
	moderationDialog.reason = ''
}

function closeModerationDialog() {
	moderationDialog.visible = false
	moderationDialog.pending = false
	moderationDialog.reason = ''
}

async function handleSubmitModeration() {
	const currentType = moderationDialog.type
	const currentTargetId = moderationDialog.targetId
	const reason = String(moderationDialog.reason || '').trim()

	if (!reason) {
		showSnack({
			text: '请填写隐藏原因',
			color: 'warning',
			icon: 'mdi-alert-circle-outline'
		})
		return
	}

	moderationDialog.pending = true

	try {
		if (currentType === 'diary') {
			await hideDiaryByAdmin({ diary_id: currentTargetId, reason })
		} else {
			await hideCommentByAdmin({ comment_id: currentTargetId, reason })
		}

		showSnack({
			text: currentType === 'diary' ? '帖子已隐藏' : '评论已隐藏',
			color: 'success',
			icon: 'mdi-check-circle-outline'
		})

		closeModerationDialog()

		if (currentType === 'diary') {
			if (selectedModerationDiaryId.value === currentTargetId) {
				selectedModerationDiaryId.value = ''
				adminDiaryIdInput.value = ''
				adminCommentRoots.value = []
				adminCommentPagination.total = 0
			}

			await loadAdminFeed()
		} else if (selectedModerationDiaryId.value) {
			await loadAdminComments(selectedModerationDiaryId.value)
		}
	} catch (error) {
		showSnack({
			text: error.message || '隐藏操作失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		moderationDialog.pending = false
	}
}

async function handleSendSystemMessage() {
	const payload = {
		target_type: systemMessageForm.targetType,
		title: String(systemMessageForm.title || '').trim(),
		content: String(systemMessageForm.content || '').trim()
	}

	if (!payload.title || !payload.content) {
		showSnack({
			text: '请填写通知标题和内容',
			color: 'warning',
			icon: 'mdi-alert-circle-outline'
		})
		return
	}

	if (payload.target_type === 'user') {
		const userId = String(systemMessageForm.userId || '').trim()

		if (!userId) {
			showSnack({
				text: '指定用户通知时必须填写用户 UUID',
				color: 'warning',
				icon: 'mdi-alert-circle-outline'
			})
			return
		}

		payload.user_id = userId
	}

	sendingSystemMessage.value = true

	try {
		await sendSystemMessage(payload)
		showSnack({
			text: '系统通知已发送',
			color: 'success',
			icon: 'mdi-check-circle-outline'
		})
		systemMessageForm.userId = ''
		systemMessageForm.title = ''
		systemMessageForm.content = ''
	} catch (error) {
		showSnack({
			text: error.message || '发送系统通知失败',
			color: 'error',
			icon: 'mdi-alert-circle-outline'
		})
	} finally {
		sendingSystemMessage.value = false
	}
}

function refresh() {
	loadAdminFeed()

	if (selectedModerationDiaryId.value) {
		loadAdminComments(selectedModerationDiaryId.value)
	}
}

defineExpose({ refresh })
</script>

<style scoped>
.comment-thread {
	padding-bottom: 12px;
	border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.comment-thread:last-child {
	padding-bottom: 0;
	border-bottom: none;
}

.comment-card-root,
.comment-card-child {
	background: rgba(var(--v-theme-surface-variant), 0.18);
	border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
