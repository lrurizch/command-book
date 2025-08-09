<template>
  <div id="app" class="app-container">
    <div class="app-layout">
      <!-- 侧边栏 -->
      <aside class="app-sidebar">
        <CategoryTree />
        <!-- 可拖拽的分割线 -->
        <ResizeBorder 
          :min-width="250"
          :max-width="500"
          :default-width="300"
          target-selector=".app-sidebar"
          storage-key="sidebar-width"
          @resize="handleSidebarResize"
          @resize-start="handleResizeStart"
          @resize-end="handleResizeEnd"
        />
      </aside>
      
      <!-- 主内容区 -->
      <main class="app-main">
        <router-view />
      </main>
    </div>
    
    <!-- 全局组件 -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CategoryTree from './components/CategoryTree.vue'
import ResizeBorder from './components/ResizeBorder.vue'
import Toast from './components/Toast.vue'
import { useCommandStore } from './stores/command'

// Store
const commandStore = useCommandStore()

// 响应式状态
const sidebarWidth = ref(300)
const isResizing = ref(false)

// 侧边栏大小调整处理
const handleSidebarResize = (width) => {
  sidebarWidth.value = width
  // 可以在这里添加其他需要响应宽度变化的逻辑
}

const handleResizeStart = (width) => {
  isResizing.value = true
  console.log('开始调整侧边栏宽度:', width)
}

const handleResizeEnd = (width) => {
  isResizing.value = false
  console.log('侧边栏宽度调整完成:', width)
  
  // 触发窗口resize事件，通知其他组件更新布局
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}

// 全局快捷键处理
const handleFocusSearch = () => {
  // 聚焦搜索框
  const searchInput = document.querySelector('.search-input input')
  if (searchInput) {
    searchInput.focus()
  }
}

const handleNewCommand = () => {
  // 触发新建命令
  window.dispatchEvent(new CustomEvent('show-command-modal'))
}

const handleOpenBuilder = () => {
  // 打开构建器
  window.dispatchEvent(new CustomEvent('show-builder-modal'))
}

// 生命周期
onMounted(() => {
  // 注册全局事件监听器
  window.addEventListener('focus-search', handleFocusSearch)
  window.addEventListener('new-command', handleNewCommand)
  window.addEventListener('open-builder', handleOpenBuilder)
  
  // 初始化应用
  console.log('🎉 命令手册增强版已启动!')
  console.log('📊 当前统计:', commandStore.getParameterStatistics.value)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('focus-search', handleFocusSearch)
  window.removeEventListener('new-command', handleNewCommand)
  window.removeEventListener('open-builder', handleOpenBuilder)
})
</script>

<style lang="scss">
// 应用根样式
#app {
  height: 100vh;
  overflow: hidden;
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.app-sidebar {
  position: relative; // 为ResizeBorder提供定位上下文
  width: 300px;
  min-width: 250px;
  max-width: 500px;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-blank);
  overflow: hidden;
  transition: width 0.3s ease;
  
  // 拖拽时禁用过渡动画
  &.is-resizing {
    transition: none;
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    width: 280px;
    min-width: 280px;
  }
}

.app-main {
  flex: 1;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}

// 全局滚动条样式
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--el-fill-color-light);
}

::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
  
  &:hover {
    background: var(--el-border-color-dark);
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .app-sidebar {
    border-right-color: var(--el-border-color-darker);
  }
}

// 过渡动画
.app-layout * {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

// 选择文本样式
::selection {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary-dark-2);
}

// 焦点样式
:focus {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

// 无障碍优化
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// 打印样式
@media print {
  .app-sidebar {
    display: none;
  }
  
  .app-main {
    margin: 0;
    width: 100%;
  }
}

// 拖拽时的全局样式
.is-resizing {
  cursor: col-resize !important;
  user-select: none !important;
  
  * {
    pointer-events: none !important;
  }
  
  .resize-border {
    pointer-events: auto !important;
  }
}
</style> 