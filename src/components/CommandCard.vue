<template>
  <div 
    class="command-card" 
    :class="{ 'is-user-created': command.isUserCreated }"
    @click="handleCardClick"
    @dblclick.stop="handleCardDoubleClick"
  >
    <!-- 主要内容区域 -->
    <div class="card-content">
      <!-- 作用 -->
      <div class="purpose-section">
        <el-tooltip :content="command.description" placement="top">
          <span class="command-name">{{ command.name }}</span>
        </el-tooltip>
      </div>
      
      <!-- 默认完整命令 -->
      <div class="command-section">
        <el-tooltip 
          :content="recentCommandText ? `点击复制: ${recentCommandText}` : '双击查看和管理常用完整命令'" 
          placement="top"
        >
          <code 
            class="command-text"
            :data-is-empty="!recentCommandText"
          >
            {{ displayRecentCommand }}
          </code>
        </el-tooltip>
      </div>
      
      <!-- 分类标签 -->
      <div class="category-section">
        <el-tag type="info" size="small">{{ categoryName }}</el-tag>
        <div class="tags-container" v-if="command.tags && command.tags.length > 0">
          <el-tag
            v-for="tag in displayTags.slice(0, 2)"
            :key="tag"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
          <el-tag
            v-if="extraTagsCount > 0"
            size="small"
            type="info"
            class="tag-item"
          >
            +{{ extraTagsCount }}
          </el-tag>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
          <el-tooltip content="复制命令" placement="top">
          <el-button :icon="CopyDocument" size="small" circle @click.stop="handleCopyRecentCommand" />
          </el-tooltip>
          
          <el-dropdown @click.stop placement="bottom-end" trigger="click">
          <el-button :icon="More" size="small" circle />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleDetail" :icon="View">
                  查看详情
                </el-dropdown-item>
                <el-dropdown-item @click="handleEdit" :icon="Edit">
                  编辑命令
                </el-dropdown-item>
              <el-dropdown-item @click="handleExecute" :icon="CaretRight">
                快速执行
              </el-dropdown-item>
              <el-dropdown-item @click="handleManageCopy" :icon="Setting">
                管理复制命令
              </el-dropdown-item>
                <el-dropdown-item @click="handleDuplicate" :icon="DocumentCopy">
                  复制为新命令
                </el-dropdown-item>
              <el-dropdown-item
                @click="handleDelete"
                :icon="Delete"
                :divided="true"
                style="color: var(--el-color-danger)"
              >
                删除命令
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'
import { CopyDocument, More, View, Edit, CaretRight, Setting, DocumentCopy, Delete } from '@element-plus/icons-vue'
import { useCommandStore } from '../stores/command'

const commandStore = useCommandStore()

const props = defineProps({
  command: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['copy', 'execute', 'edit', 'delete', 'detail', 'build', 'restore', 'manageCopy', 'duplicate', 'showCommonCommands'])

// 获取分类名称
const categoryName = computed(() => {
  const category = commandStore.categories.find(cat => cat.id === props.command.category)
  return category ? category.name : '未分类'
})

// 显示的标签
const displayTags = computed(() => {
  return props.command.tags || []
})

// 额外的标签数量
const extraTagsCount = computed(() => {
  const total = (props.command.tags || []).length
  return total > 2 ? total - 2 : 0
})

// 获取默认完整命令
const recentCommandText = computed(() => {
  if (!props.command) return ''
  
  // 优先使用默认复制命令
  const defaultCommand = commandStore.getDefaultCopyCommand(props.command.id)
  if (defaultCommand) return defaultCommand
  
  // 回退到原始命令
  return props.command.command || ''
})

// 显示的命令文本
const displayRecentCommand = computed(() => {
  const text = recentCommandText.value
  if (!text) {
    return '双击查看常用命令'
  }
  
  return text
})

// 用于区分单击和双击的定时器
let clickTimer = null

// 卡片点击处理
const handleCardClick = () => {
  // 如果存在定时器，说明这是双击的第二次点击，取消单击
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
    return
  }
  
  // 设置延迟执行单击逻辑，如果在延迟期间有双击，会被上面的逻辑取消
  clickTimer = setTimeout(() => {
    clickTimer = null
    
    const defaultCommand = recentCommandText.value
    
    // 检查是否有可用的默认命令
    if (!defaultCommand) {
      // 没有任何默认命令，显示常用命令弹窗
      emit('showCommonCommands', props.command)
    } else {
      // 有默认完整命令，直接复制
      emit('copy', props.command)
    }
  }, 200) // 200ms延迟，足够区分单击和双击
}

// 卡片双击处理
const handleCardDoubleClick = () => {
  // 清除单击定时器
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
  
  // 双击显示常用完整命令弹窗
  emit('showCommonCommands', props.command)
}

// 复制命令处理
const handleCopyRecentCommand = (e) => {
  if (e) {
    e.stopPropagation()
  }
  
  const defaultCommand = recentCommandText.value
  
  if (!defaultCommand) {
    // 没有任何默认命令，显示常用命令弹窗
    emit('showCommonCommands', props.command)
  } else {
    // 有默认完整命令，直接复制
    emit('copy', props.command)
  }
}

// 其他事件处理
const handleDetail = (e) => {
  e.stopPropagation()
  emit('detail', props.command)
}

const handleEdit = (e) => {
  e.stopPropagation()
  emit('edit', props.command)
}

const handleExecute = (e) => {
  e.stopPropagation()
  emit('execute', props.command)
}

const handleDelete = (e) => {
  e.stopPropagation()
  emit('delete', props.command)
}

const handleDuplicate = (e) => {
  e.stopPropagation()
  emit('duplicate', props.command)
}

const handleManageCopy = (e) => {
  e.stopPropagation()
  emit('manageCopy', props.command)
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
  }
})
</script>

<style lang="scss" scoped>
.command-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary-light-5);
  }
  
  &.is-user-created {
    background: var(--el-color-primary-light-9);
  }
  }
  
.card-content {
    display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  min-height: 48px;
}

.purpose-section {
  flex: 0 0 200px;
      min-width: 0;
      
      .command-name {
    font-size: 14px;
    font-weight: 500;
        color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
      }
      
.command-section {
  flex: 1;
  min-width: 0;
  
  .command-text {
    font-family: var(--el-font-family-monospace);
    font-size: 13px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    transition: all 0.2s ease;
    
    // 添加没有命令时的样式
    &:empty::before {
      content: '点击构建命令';
      color: var(--el-text-color-secondary);
      font-style: italic;
    }
    
    // 当显示空状态提示时的样式  
    &[data-is-empty="true"] {
      color: var(--el-text-color-secondary);
      font-style: italic;
      background: var(--el-fill-color-lighter);
      border: 1px dashed var(--el-border-color);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-5);
        color: var(--el-color-primary);
      }
    }
  }
}

.category-section {
  flex: 0 0 200px;
          display: flex;
          align-items: center;
          gap: 8px;
          
  .tags-container {
            display: flex;
    align-items: center;
            gap: 4px;
    margin-left: 4px;
    
    .tag-item {
      font-size: 12px;
            }
          }
}

.actions-section {
  flex: 0 0 auto;
          display: flex;
          align-items: center;
  gap: 8px;
}
</style> 