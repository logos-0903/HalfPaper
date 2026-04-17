<template>
  <div
    v-if="total > 0"
    class="d-flex flex-column flex-sm-row align-center justify-space-between ga-3"
  >
    <div class="d-flex align-center ga-2 text-body-2 text-medium-emphasis">
      <v-chip color="secondary" size="small" variant="tonal">第 {{ currentPage }} / {{ pageCount }} 页</v-chip>
      <span>共 {{ total }} 条</span>
    </div>

    <div class="d-flex flex-wrap justify-end ga-2">
      <v-btn
        rounded="lg"
        variant="outlined"
        :disabled="isFirstPage || disabled"
        @click="emitPage(currentPage - 1)"
      >
        上一页
      </v-btn>

      <v-btn
        rounded="lg"
        variant="outlined"
        :disabled="isLastPage || disabled"
        @click="emitPage(currentPage + 1)"
      >
        下一页
      </v-btn>

      <v-btn
        color="primary"
        rounded="lg"
        :disabled="isLastPage || disabled"
        @click="emitPage(pageCount)"
      >
        末页
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 1
  },
  total: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 20
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const pageCount = computed(() => {
  const size = Number(props.pageSize || 0)

  if (size <= 0) {
    return 0
  }

  return Math.max(1, Math.ceil(Number(props.total || 0) / size))
})

const currentPage = computed(() => {
  const current = Number(props.modelValue || 1)
  return Math.min(Math.max(1, current), pageCount.value || 1)
})

const isFirstPage = computed(() => currentPage.value <= 1)
const isLastPage = computed(() => currentPage.value >= pageCount.value)

function emitPage(nextPage) {
  if (nextPage < 1 || nextPage > pageCount.value || nextPage === currentPage.value) {
    return
  }

  emit('update:modelValue', nextPage)
}
</script>