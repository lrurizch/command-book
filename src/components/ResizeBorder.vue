<template>
  <div 
    class="resize-border"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <div class="resize-handle">
      <div class="resize-line"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  // 最小宽度
  minWidth: {
    type: Number,
    default: 250
  },
  // 最大宽度
  maxWidth: {
    type: Number,
    default: 500
  },
  // 默认宽度
  defaultWidth: {
    type: Number,
    default: 300
  },
  // 目标元素选择器
  targetSelector: {
    type: String,
    default: '.app-sidebar'
  },
  // 存储键名
  storageKey: {
    type: String,
    default: 'sidebar-width'
  }
})

// Emits
const emit = defineEmits(['resize', 'resize-start', 'resize-end'])

// 响应式状态
const isDragging = ref(false)
const startX = ref(0)
const startWidth = ref(0)
const currentWidth = ref(props.defaultWidth)

// 获取目标元素
const getTargetElement = () => {
  return document.querySelector(props.targetSelector)
}

// 加载保存的宽度
const loadSavedWidth = () => {
  try {
    const saved = localStorage.getItem(props.storageKey)
    if (saved) {
      const width = parseInt(saved)
      if (width >= props.minWidth && width <= props.maxWidth) {
        currentWidth.value = width
        applyWidth(width)
      }
    }
  } catch (error) {
    console.warn('加载侧边栏宽度失败:', error)
  }
}

// 保存宽度
const saveWidth = (width) => {
  try {
    localStorage.setItem(props.storageKey, width.toString())
  } catch (error) {
    console.warn('保存侧边栏宽度失败:', error)
  }
}

// 应用宽度
const applyWidth = (width) => {
  const targetElement = getTargetElement()
  if (targetElement) {
    targetElement.style.width = `${width}px`
    currentWidth.value = width
    emit('resize', width)
  }
}

// 鼠标按下处理
const handleMouseDown = (event) => {
  event.preventDefault()
  startDragging(event.clientX)
}

// 触摸开始处理
const handleTouchStart = (event) => {
  event.preventDefault()
  const touch = event.touches[0]
  startDragging(touch.clientX)
}

// 开始拖拽
const startDragging = (clientX) => {
  const targetElement = getTargetElement()
  if (!targetElement) return

  isDragging.value = true
  startX.value = clientX
  startWidth.value = targetElement.offsetWidth
  
  // 添加拖拽状态类
  document.body.classList.add('is-resizing')
  targetElement.classList.add('is-resizing')
  
  // 添加全局事件监听器
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
  
  // 防止选择文本
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
  
  emit('resize-start', startWidth.value)
}

// 鼠标移动处理
const handleMouseMove = (event) => {
  if (!isDragging.value) return
  event.preventDefault()
  updateWidth(event.clientX)
}

// 触摸移动处理
const handleTouchMove = (event) => {
  if (!isDragging.value) return
  event.preventDefault()
  const touch = event.touches[0]
  updateWidth(touch.clientX)
}

// 更新宽度
const updateWidth = (clientX) => {
  const deltaX = clientX - startX.value
  let newWidth = startWidth.value + deltaX
  
  // 应用限制
  newWidth = Math.max(props.minWidth, Math.min(props.maxWidth, newWidth))
  
  applyWidth(newWidth)
}

// 结束拖拽
const stopDragging = () => {
  if (!isDragging.value) return
  
  isDragging.value = false
  
  // 移除拖拽状态类
  document.body.classList.remove('is-resizing')
  const targetElement = getTargetElement()
  if (targetElement) {
    targetElement.classList.remove('is-resizing')
  }
  
  // 移除全局事件监听器
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  
  // 恢复样式
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  
  // 保存宽度
  saveWidth(currentWidth.value)
  
  emit('resize-end', currentWidth.value)
}

// 鼠标抬起处理
const handleMouseUp = (event) => {
  event.preventDefault()
  stopDragging()
}

// 触摸结束处理
const handleTouchEnd = (event) => {
  event.preventDefault()
  stopDragging()
}

// 双击重置
const handleDoubleClick = () => {
  applyWidth(props.defaultWidth)
  saveWidth(props.defaultWidth)
}

// 键盘处理
const handleKeyDown = (event) => {
  if (!isDragging.value) return
  
  if (event.key === 'Escape') {
    // ESC 取消拖拽，恢复原宽度
    applyWidth(startWidth.value)
    stopDragging()
  } else if (event.key === 'Enter') {
    // 回车确认
    stopDragging()
  }
}

// 生命周期
onMounted(() => {
  // 加载保存的宽度
  loadSavedWidth()
  
  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeyDown)
  
  // 添加双击事件
  const borderElement = document.querySelector('.resize-border')
  if (borderElement) {
    borderElement.addEventListener('dblclick', handleDoubleClick)
  }
})

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)
  
  // 清理样式
  if (isDragging.value) {
    document.body.classList.remove('is-resizing')
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }
})

// 暴露方法
defineExpose({
  currentWidth,
  applyWidth,
  resetWidth: () => {
    applyWidth(props.defaultWidth)
    saveWidth(props.defaultWidth)
  }
})
</script>

<style lang="scss" scoped>
.resize-border {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 1000;
  user-select: none;
  
  // 扩大点击区域
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -3px;
    right: -3px;
    bottom: 0;
    z-index: -1;
  }
  
  .resize-handle {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    .resize-line {
      width: 2px;
      height: 60px;
      background: var(--el-border-color);
      border-radius: 1px;
      opacity: 0;
      transition: all 0.2s ease;
      transform: scaleY(0);
    }
  }
  
  // 悬停效果
  &:hover {
    .resize-handle {
      background: var(--el-color-primary-light-9);
      
      .resize-line {
        opacity: 1;
        transform: scaleY(1);
        background: var(--el-color-primary);
      }
    }
  }
  
  // 拖拽状态
  &:active,
  &.is-dragging {
    .resize-handle {
      background: var(--el-color-primary-light-8);
      
      .resize-line {
        opacity: 1;
        transform: scaleY(1.2);
        background: var(--el-color-primary-dark-2);
        box-shadow: 0 0 4px var(--el-color-primary);
      }
    }
  }
}

// 全局拖拽状态样式
:global(.is-resizing) {
  cursor: col-resize !important;
  user-select: none !important;
  
  * {
    pointer-events: none !important;
  }
  
  .resize-border {
    pointer-events: auto !important;
  }
}

// 侧边栏拖拽状态
:global(.app-sidebar.is-resizing) {
  transition: none !important;
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .resize-border {
    .resize-line {
      background: var(--el-border-color-light);
    }
    
    &:hover .resize-line {
      background: var(--el-color-primary-light-3);
    }
  }
}

// 移动端优化
@media (max-width: 768px) {
  .resize-border {
    display: none; // 移动端不显示拖拽功能
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .resize-border {
    .resize-line {
      background: var(--el-text-color-primary);
    }
  }
}

// 减少动画模式
@media (prefers-reduced-motion: reduce) {
  .resize-border {
    .resize-handle,
    .resize-line {
      transition: none !important;
    }
  }
}
</style> 