import { computed, inject, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { createComment, likeComment, listCommentReplies, listComments, unlikeComment } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/format'

function normalizeCommentItem(item) {
	return {
		id: item?.id || '',
		diary_id: item?.diary_id || '',
		root_id: item?.root_id ?? null,
		parent_id: item?.parent_id ?? null,
		content: item?.content || '',
		created_at: item?.created_at || null,
		member: item?.member || null,
		like_count: toPositiveNumber(item?.like_count, 0),
		is_liked: Boolean(item?.is_liked),
		rcount: Number(item?.rcount || 0),
		replies: Array.isArray(item?.replies) ? item.replies : []
	}
}

function normalizeReplyItem(item) {
	return {
		id: item?.id || '',
		diary_id: item?.diary_id || '',
		root_id: item?.root_id ?? null,
		parent_id: item?.parent_id ?? null,
		content: item?.content || '',
		created_at: item?.created_at || null,
		member: item?.member || null,
		like_count: toPositiveNumber(item?.like_count, 0),
		is_liked: Boolean(item?.is_liked),
		reply_to: item?.reply_to || null
	}
}

function uniqById(items) {
	const bucket = new Map()

	items.forEach((item) => {
		if (!item?.id) {
			return
		}

		bucket.set(item.id, item)
	})

	return Array.from(bucket.values())
}

function toPositiveNumber(value, fallback = 0) {
	const parsed = Number(value)
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function useDiaryComments() {
	const SnackBar = inject('snack', null)
	const authStore = useAuthStore()
	const { profile } = storeToRefs(authStore)

	const loadingComments = ref(false)
	const submitting = ref(false)
	const diaryId = ref('')

	const comments = ref([])
	const commentsPage = ref(1)
	const commentsPageSize = 20
	const commentsTotal = ref(0)

	const draft = reactive({
		topLevel: ''
	})

	const replyBox = reactive({
		rootId: '',
		parentId: null,
		targetName: '',
		content: ''
	})

	const rootReplyState = reactive({})
	const commentLikeLoading = reactive({})

	const totalCommentCount = computed(() => Number(commentsTotal.value || comments.value.length))

	function initRootState(rootComment) {
		if (!rootComment?.id) {
			return
		}

		const previewReplies = (rootComment.replies || []).map(normalizeReplyItem)
		const totalCount = toPositiveNumber(rootComment.rcount, previewReplies.length)

		rootReplyState[rootComment.id] = {
			loading: false,
			page: 0,
			nextPage: 1,
			totalPages: 0,
			total: totalCount,
			replies: previewReplies,
			loadedAll: previewReplies.length >= totalCount
		}
	}

	function getRootState(rootId) {
		if (!rootReplyState[rootId]) {
			rootReplyState[rootId] = {
				loading: false,
				page: 0,
				nextPage: 1,
				totalPages: 0,
				total: 0,
				replies: [],
				loadedAll: false
			}
		}

		return rootReplyState[rootId]
	}

	function formatCommentTime(value) {
		return formatDate(value)
	}

	function getMemberName(member) {
		return member?.username || '匿名用户'
	}

	function getReplyDisplayPrefix(rootComment, replyItem, allReplies) {
		if (!replyItem?.parent_id) {
			return ''
		}

		const byId = new Map()

		allReplies.forEach((item) => {
			if (item?.id) {
				byId.set(item.id, item)
			}
		})

		const parentReply = byId.get(replyItem.parent_id)

		if (parentReply?.member?.username) {
			return `回复 @${parentReply.member.username}：`
		}

		if (rootComment?.member?.username) {
			return `回复 @${rootComment.member.username}：`
		}

		return ''
	}

	function getRootReplies(rootComment) {
		const state = getRootState(rootComment.id)

		if (!state.replies.length && Array.isArray(rootComment.replies)) {
			state.replies = rootComment.replies.map(normalizeReplyItem)
			state.total = rootComment.rcount || state.replies.length
			state.loadedAll = state.replies.length >= state.total
		}

		return state.replies
	}

	function canShowLoadMore(rootComment) {
		const state = getRootState(rootComment.id)

		if (state.loading) {
			return false
		}

		const total = Math.max(
			toPositiveNumber(rootComment?.rcount, 0),
			toPositiveNumber(state.total, 0)
		)

		if (!total) {
			return false
		}

		return state.replies.length < total
	}

	function openReplyToRoot(rootComment) {
		replyBox.rootId = rootComment.id
		replyBox.parentId = null
		replyBox.targetName = getMemberName(rootComment.member)
		replyBox.content = ''
	}

	function isCommentLikeLoading(commentId) {
		return Boolean(commentLikeLoading[commentId])
	}

	function setCommentLikeLoading(commentId, loading) {
		if (!commentId) {
			return
		}

		commentLikeLoading[commentId] = Boolean(loading)
	}

	function patchLikeState(targetComment, serverPayload, nextLiked) {
		const liked = typeof serverPayload?.is_liked === 'boolean'
			? serverPayload.is_liked
			: nextLiked

		const fallbackCount = Math.max(0, toPositiveNumber(targetComment.like_count, 0) + (liked ? 1 : -1))

		targetComment.is_liked = liked
		targetComment.like_count = toPositiveNumber(serverPayload?.like_count, fallbackCount)
	}

	async function toggleRootCommentLike(rootComment) {
		const commentId = rootComment?.id

		if (!commentId || isCommentLikeLoading(commentId)) {
			return
		}

		setCommentLikeLoading(commentId, true)

		const nextLiked = !Boolean(rootComment.is_liked)

		try {
			const result = nextLiked
				? await likeComment(commentId)
				: await unlikeComment(commentId)

			patchLikeState(rootComment, result, nextLiked)
		} catch (error) {
			console.error('[toggle root comment like error]', error)
			SnackBar?.({
				text: '点赞操作失败，请稍后重试',
				color: 'error',
				icon: 'mdi-alert-circle-outline'
			})
		} finally {
			setCommentLikeLoading(commentId, false)
		}
	}

	async function toggleChildCommentLike(rootComment, childComment) {
		const commentId = childComment?.id

		if (!commentId || isCommentLikeLoading(commentId)) {
			return
		}

		const state = getRootState(rootComment?.id)
		const target = state.replies.find((item) => item.id === commentId)

		if (!target) {
			return
		}

		setCommentLikeLoading(commentId, true)

		const nextLiked = !Boolean(target.is_liked)

		try {
			const result = nextLiked
				? await likeComment(commentId)
				: await unlikeComment(commentId)

			patchLikeState(target, result, nextLiked)
		} catch (error) {
			console.error('[toggle child comment like error]', error)
			SnackBar?.({
				text: '点赞操作失败，请稍后重试',
				color: 'error',
				icon: 'mdi-alert-circle-outline'
			})
		} finally {
			setCommentLikeLoading(commentId, false)
		}
	}

	function openReplyToChild(rootComment, childComment) {
		replyBox.rootId = rootComment.id
		replyBox.parentId = childComment.id
		replyBox.targetName = getMemberName(childComment.member)
		replyBox.content = ''
	}

	function cancelReply() {
		replyBox.rootId = ''
		replyBox.parentId = null
		replyBox.targetName = ''
		replyBox.content = ''
	}

	async function loadComments(targetDiaryId) {
		diaryId.value = String(targetDiaryId || '').trim()

		if (!diaryId.value) {
			comments.value = []
			commentsTotal.value = 0
			return
		}

		loadingComments.value = true

		try {
			const data = await listComments({
				diary_id: diaryId.value,
				page: commentsPage.value,
				page_size: commentsPageSize
			})

			const rootComments = Array.isArray(data?.replies)
				? data.replies.map(normalizeCommentItem)
				: []

			comments.value = rootComments
			commentsTotal.value = Number(data?.pagination?.total || rootComments.length)

			Object.keys(rootReplyState).forEach((key) => {
				delete rootReplyState[key]
			})

			rootComments.forEach((rootComment) => {
				initRootState(rootComment)
			})
		} catch (error) {
			console.error('[load comments error]', error)
			SnackBar?.({
				text: '读取评论失败',
				color: 'error',
				icon: 'mdi-alert-circle-outline'
			})
		} finally {
			loadingComments.value = false
		}
	}

	async function loadMoreReplies(rootComment) {
		const rootId = rootComment?.id

		if (!rootId || !diaryId.value) {
			return
		}

		const state = getRootState(rootId)

		if (state.loading) {
			return
		}

		if (state.loadedAll) {
			SnackBar?.({
				text: '没有更多回复了',
				color: 'info',
				icon: 'mdi-information-outline'
			})
			return
		}

		state.loading = true

		try {
			async function fetchReplyPage(pageValue) {
				const data = await listCommentReplies({
					diary_id: diaryId.value,
					root_id: rootId,
					page: pageValue,
					page_size: commentsPageSize
				})

				const currentReplies = Array.isArray(data?.replies)
					? data.replies.map(normalizeReplyItem)
					: []

				const beforeCount = state.replies.length

				state.replies = uniqById([...state.replies, ...currentReplies])
				state.page = Number(data?.pagination?.page || pageValue)
				state.nextPage = state.page + 1
				state.totalPages = Number(data?.pagination?.total_pages || 0)
				state.total = Number(data?.pagination?.total || rootComment?.rcount || state.replies.length)
				state.loadedAll = state.replies.length >= state.total ||
					(state.totalPages > 0 && state.page >= state.totalPages)

				return state.replies.length - beforeCount
			}

			const firstPage = state.nextPage || 1
			const appendedCount = await fetchReplyPage(firstPage)

			if (appendedCount <= 0 && !state.loadedAll) {
				await fetchReplyPage(state.nextPage || (firstPage + 1))
			}
		} catch (error) {
			console.error('[load more replies error]', error)
			SnackBar?.({
				text: '读取更多回复失败',
				color: 'error',
				icon: 'mdi-alert-circle-outline'
			})
		} finally {
			state.loading = false
		}
	}

	async function submitTopLevelComment() {
		if (!diaryId.value || submitting.value) {
			return
		}

		const content = String(draft.topLevel || '').trim()

		if (!content) {
			SnackBar?.({
				text: '请输入评论内容',
				color: 'warning',
				icon: 'mdi-alert-outline'
			})
			return
		}

		submitting.value = true

		try {
			await createComment({
				diary_id: diaryId.value,
				content,
				root_id: null,
				parent_id: null
			})

			draft.topLevel = ''

			SnackBar?.({
				text: '评论成功',
				color: 'success',
				icon: 'mdi-check-circle-outline'
			})

			await loadComments(diaryId.value)
		} catch (error) {
			console.error('[submit top comment error]', error)
			SnackBar?.({
				text: '评论失败，请稍后重试',
				color: 'error',
				icon: 'mdi-alert-circle-outline'
			})
		} finally {
			submitting.value = false
		}
	}

	async function submitReply() {
		if (!diaryId.value || submitting.value) {
			return
		}

		const rootId = String(replyBox.rootId || '').trim()
		const content = String(replyBox.content || '').trim()

		if (!rootId) {
			SnackBar?.({
				text: '请选择回复目标',
				color: 'warning',
				icon: 'mdi-alert-outline'
			})
			return
		}

		if (!content) {
			SnackBar?.({
				text: '请输入回复内容',
				color: 'warning',
				icon: 'mdi-alert-outline'
			})
			return
		}

		submitting.value = true

		try {
			await createComment({
				diary_id: diaryId.value,
				content,
				root_id: rootId || null,
				parent_id: replyBox.parentId || null
			})

			SnackBar?.({
				text: '回复成功',
				color: 'success',
				icon: 'mdi-check-circle-outline'
			})

			cancelReply()
			await loadComments(diaryId.value)
		} catch (error) {
			console.error('[submit reply error]', error)
			SnackBar?.({
				text: '回复失败，请稍后重试',
				color: 'error',
				icon: 'mdi-alert-circle-outline'
			})
		} finally {
			submitting.value = false
		}
	}

	function isReplyingRoot(rootComment) {
		return replyBox.rootId === rootComment?.id
	}

	return {
		profile,
		loadingComments,
		comments,
		draft,
		replyBox,
		rootReplyState,
		submitting,
		totalCommentCount,
		formatCommentTime,
		getMemberName,
		getRootReplies,
		getReplyDisplayPrefix,
		canShowLoadMore,
		isCommentLikeLoading,
		isReplyingRoot,
		loadComments,
		loadMoreReplies,
		toggleRootCommentLike,
		toggleChildCommentLike,
		openReplyToRoot,
		openReplyToChild,
		cancelReply,
		submitTopLevelComment,
		submitReply
	}
}
