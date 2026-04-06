import { reactive, nextTick } from 'vue'

export const useSnack = () => {
  const state = reactive({
    show: false,
    text: '',
    color: 'info',
    icon: ''
  })

  function SnackBar({ text, color = 'info', icon = '' }) {
    state.show = false          // 先关，防止同内容不刷新
    nextTick(() => {
      Object.assign(state, { text, color, icon })
      state.show = true
    })
  }

  return { snack: state, SnackBar }
}