<template>
  <Teleport to="body">
    <Transition name="toast" appear>
      <div v-if="visible" :class="['toast', `toast-${type}`]">
        <div class="toast-icon">
          <span v-if="type === 'success'">✅</span>
          <span v-else-if="type === 'error'">❌</span>
          <span v-else-if="type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ title }}</div>
          <div v-if="message" class="toast-message">{{ message }}</div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 1000
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)
let timer = null

const show = () => {
  visible.value = true
  
  if (props.duration > 0) {
    timer = setTimeout(() => {
      close()
    }, props.duration)
  }
}

const close = () => {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  
  // 延迟触发关闭事件，等待动画完成
  setTimeout(() => {
    emit('close')
  }, 300)
}

onMounted(() => {
  show()
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

// 暴露方法给父组件
defineExpose({
  show,
  close
})
</script>

<style lang="scss" scoped>
// Element Plus Toast 样式
  .toast {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    min-width: 320px;
    max-width: 480px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    box-shadow: var(--el-box-shadow-dark);
    display: flex;
    align-items: flex-start;
    gap: var(--el-spacing-sm);
    padding: var(--el-spacing-md);
    z-index: var(--el-index-popper);
  
  &.toast-success {
    border-left: 4px solid var(--el-color-success);
    background: var(--el-color-success-light-9);
    
    .toast-icon {
      color: var(--el-color-success);
    }
  }
  
  &.toast-error {
    border-left: 4px solid var(--el-color-danger);
    background: var(--el-color-danger-light-9);
    
    .toast-icon {
      color: var(--el-color-danger);
    }
  }
  
  &.toast-warning {
    border-left: 4px solid var(--el-color-warning);
    background: var(--el-color-warning-light-9);
    
    .toast-icon {
      color: var(--el-color-warning);
    }
  }
  
  &.toast-info {
    border-left: 4px solid var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    
    .toast-icon {
      color: var(--el-color-primary);
    }
  }
  
  .toast-icon {
    font-size: var(--font-size-lg);
    line-height: 1;
    margin-top: 2px;
  }
  
  .toast-content {
    flex: 1;
    min-width: 0;
    
    .toast-title {
      font-weight: 600;
      font-size: var(--font-size-base);
      color: var(--text-primary);
      margin-bottom: 2px;
    }
    
    .toast-message {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      word-break: break-word;
    }
  }
  

}

// 动画
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

// 响应式设计
@media (max-width: 768px) {
  .toast {
    left: 20px;
    right: 20px;
    min-width: auto;
    max-width: none;
    transform: translateY(0);
  }
  
  .toast-enter-from,
  .toast-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }
}
</style> 