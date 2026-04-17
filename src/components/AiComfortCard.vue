<template>
  <div ref="rootRef" class="ai-comfort-card-root">
    <v-skeleton-loader
      v-if="aiShowSkeleton"
      type="article, actions"
      class="rounded-xl"
    />

    <Transition name="fade" @after-enter="handleAiCardAfterEnter">
      <v-card v-if="aiShowCard" rounded="xl" border>
        <v-card-text class="pa-7">
          <div v-if="!aiMessages.length" class="ai-empty-state text-medium-emphasis">
            可以在下方输入想说的话
          </div>

          <div v-else ref="aiChatListRef" class="ai-chat-list" @scroll.passive="onAiChatScroll">
            <div
              v-for="(item, index) in aiMessages"
              :key="`${item.role}-${index}`"
              :class="['ai-chat-item', item.role === 'user' ? 'is-user' : 'is-ai']"
            >
              <div class="ai-chat-bubble">
                {{ item.content }}
                <v-icon v-if="aiCursorVisible && aiTypingMessageIndex === index" size="18" class="ai-cursor">mdi-cursor-text</v-icon>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-text class="pt-4 px-7 pb-3">
          <v-text-field
            ref="aiInputRef"
            v-model="aiDraftMessage"
            label="输入你想说的话"
            variant="outlined"
            hide-details
            :disabled="!aiCanSendMessage"
            @keydown.enter.prevent="submitAiMessage"
          />
        </v-card-text>

        <v-card-actions class="px-7 pb-7 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="handleClose">关闭</v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            :loading="aiGenerating"
            :disabled="!aiCanSendMessage || !String(aiDraftMessage || '').trim()"
            @click="submitAiMessage"
          >
            发送
          </v-btn>
        </v-card-actions>
      </v-card>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useAiComfort } from '@/composables/useAiComfort'

const props = defineProps({
  diaryId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['opened'])

const rootRef = ref(null)
const aiChatListRef = ref(null)
const aiInputRef = ref(null)
const aiStickToBottom = ref(true)

const {
  generating: aiGenerating,
  showSkeleton: aiShowSkeleton,
  showCard: aiShowCard,
  messages: aiMessages,
  draftMessage: aiDraftMessage,
  canSendMessage: aiCanSendMessage,
  typingMessageIndex: aiTypingMessageIndex,
  cursorVisible: aiCursorVisible,
  openStream: openAiComfortStream,
  sendMessage: submitAiMessage,
  onCardAfterEnter: onAiCardAfterEnter,
  closeCard: closeAiComfortCard
} = useAiComfort()

const aiMessageRenderKey = computed(() => {
  return aiMessages.value
    .map((item, index) => `${index}:${String(item.content || '').length}`)
    .join('|')
})

watch(aiShowCard, async (visible) => {
  if (!visible) {
    aiStickToBottom.value = true
    return
  }

  aiStickToBottom.value = true
  await nextTick()
  scrollAiChatToBottom()
})

watch([aiMessageRenderKey, aiGenerating, aiCursorVisible], async () => {
  if (!aiStickToBottom.value) {
    return
  }

  if (!aiGenerating.value && !aiCursorVisible.value) {
    return
  }

  await nextTick()
  scrollAiChatToBottom()
})

function scrollAiChatToBottom() {
  const element = aiChatListRef.value

  if (!element) {
    return
  }

  element.scrollTop = element.scrollHeight
}

function onAiChatScroll() {
  const element = aiChatListRef.value

  if (!element) {
    return
  }

  const remain = element.scrollHeight - element.scrollTop - element.clientHeight
  aiStickToBottom.value = remain <= 24
}

function focusInput() {
  nextTick(() => {
    aiInputRef.value?.focus()
  })
}

function handleAiCardAfterEnter() {
  onAiCardAfterEnter()
  scrollAiChatToBottom()
  focusInput()
  emit('opened', rootRef.value)
}

function handleClose() {
  closeAiComfortCard()
}

async function open() {
  const diaryId = String(props.diaryId || '').trim()

  if (!diaryId) {
    return
  }

  if (aiShowCard.value || aiShowSkeleton.value) {
    await nextTick()
    scrollAiChatToBottom()
    focusInput()
    emit('opened', rootRef.value)
    return
  }

  openAiComfortStream(diaryId)
}

function close() {
  closeAiComfortCard()
}

defineExpose({
  open,
  close,
  generating: aiGenerating
})
</script>

<style scoped>
.ai-comfort-card-root {
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.ai-empty-state {
  min-height: 60px;
  line-height: 1.8;
}

.ai-chat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.ai-chat-item {
  display: flex;
}

.ai-chat-item.is-user {
  justify-content: flex-end;
}

.ai-chat-item.is-ai {
  justify-content: flex-start;
}

.ai-chat-bubble {
  max-width: min(88%, 560px);
  padding: 10px 12px;
  border-radius: 12px;
  white-space: pre-wrap;
  line-height: 1.9;
  word-break: break-word;
  background: rgba(var(--v-theme-primary), 0.12);
}

.ai-chat-item.is-user .ai-chat-bubble {
  background: rgba(var(--v-theme-primary), 0.18);
}

.ai-cursor {
  vertical-align: middle;
  animation: ai-cursor-blink 1s steps(1, end) infinite;
}

@keyframes ai-cursor-blink {
  0%,
  50% {
    opacity: 1;
  }

  50.01%,
  100% {
    opacity: 0;
  }
}
</style>