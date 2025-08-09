<template>
  <div class="tag-bar">
    <div class="tag-bar-header">
      <div class="tag-header-left">
        <span class="tag-bar-title">标签</span>
        <button 
          v-if="selectedTags.length > 0"
          class="clear-tags-btn btn btn-sm btn-secondary"
          @click="clearAllTags"
        >
          清除 ({{ selectedTags.length }})
        </button>
      </div>
    </div>
    
    <div class="tag-list" ref="tagListRef">
      <div
        v-for="tag in allTags"
        :key="tag"
        :class="['tag-item', { 'active': selectedTags.includes(tag) }]"
        @click="toggleTag(tag)"
        :data-tag="tag"
      >
        <span class="tag-name">{{ tag }}</span>
        <span class="tag-count">{{ getTagCount(tag) }}</span>
      </div>
    </div>
    

  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useCommandStore } from '../stores/command'
import Sortable from 'sortablejs'

const commandStore = useCommandStore()
const tagListRef = ref(null)

// 初始化拖拽排序
const initSortable = () => {
  if (!tagListRef.value) return

  new Sortable(tagListRef.value, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    onEnd: (evt) => {
      const items = Array.from(evt.target.children).map(el => el.getAttribute('data-tag'))
      commandStore.updateSortOrder('tags', items)
    }
  })
}

// 在组件挂载后初始化拖拽
onMounted(() => {
  nextTick(() => {
    initSortable()
  })
})

const props = defineProps({
  selectedTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:selectedTags'])

// 所有标签（使用排序后的列表）
const allTags = computed(() => commandStore.sortedTags)

// 切换标签选择状态
const toggleTag = (tag) => {
  const newSelectedTags = [...props.selectedTags]
  const index = newSelectedTags.indexOf(tag)
  
  if (index > -1) {
    // 如果已选中，则取消选择
    newSelectedTags.splice(index, 1)
  } else {
    // 如果未选中，则添加选择
    newSelectedTags.push(tag)
  }
  
  emit('update:selectedTags', newSelectedTags)
}



// 清除所有标签
const clearAllTags = () => {
  emit('update:selectedTags', [])
}

// 获取标签对应的命令数量
const getTagCount = (tag) => {
  return commandStore.commands.filter(cmd => cmd.tags.includes(tag)).length
}
</script>

<style lang="scss" scoped>
// Element Plus 标签栏样式
.tag-bar {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: var(--el-spacing-sm) var(--el-spacing-md);
  box-shadow: var(--el-box-shadow-light);
}

.tag-bar-header {
  margin-bottom: var(--el-spacing-sm);
  
  .tag-header-left {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-sm);
  }
  
  .tag-bar-title {
    font-size: var(--el-font-size-small);
    font-weight: var(--el-font-weight-primary);
    color: var(--el-text-color-primary);
  }
  
  .clear-tags-btn {
    padding: 4px 8px;
    font-size: var(--el-font-size-extra-small);
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--el-spacing-xs);
  margin-bottom: var(--el-spacing-sm);
  min-height: 32px;
}

// 拖拽相关样式
.sortable-ghost {
  opacity: 0.5;
  background: var(--el-color-primary-light-9) !important;
  border: 1px dashed var(--el-color-primary) !important;
}

.sortable-drag {
  background: var(--el-bg-color) !important;
  box-shadow: var(--el-box-shadow-light);
  cursor: move !important;
  opacity: 0.9;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: var(--el-spacing-xs);
  padding: var(--el-spacing-xs) var(--el-spacing-sm);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  transition: var(--el-transition-all);
  font-size: var(--el-font-size-small);
  user-select: none;
  
  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    transform: translateY(-1px);
    box-shadow: var(--el-box-shadow-light);
  }
  
  &.active {
    background: var(--el-color-primary);
    color: var(--el-color-white);
    border-color: var(--el-color-primary);
    
    .tag-name {
      color: var(--el-color-white);
      font-weight: var(--el-font-weight-primary);
    }
    
    .tag-count {
      background: rgba(255, 255, 255, 0.2);
      color: var(--el-color-white);
    }
  }
  
  .tag-name {
    color: var(--el-text-color-primary);
    transition: var(--el-transition-all);
  }
  
  .tag-count {
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    font-size: var(--el-font-size-extra-small);
    padding: 2px 6px;
    border-radius: var(--el-border-radius-round);
    min-width: 18px;
    text-align: center;
    transition: var(--el-transition-all);
  }
}



// Element Plus 响应式设计
@media (max-width: 768px) {
  .tag-bar {
    padding: var(--el-spacing-xs) var(--el-spacing-sm);
  }
  
  .tag-bar-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--el-spacing-xs);
  }
  
  .tag-item {
    font-size: var(--el-font-size-extra-small);
    padding: 4px 8px;
  }
}
</style> 