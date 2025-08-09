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
        <el-tooltip :content="recentCommandText" placement="top">
          <code class="command-text">{{ displayRecentCommand }}</code>
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
import { computed } from 'vue'
import { useCommandStore } from '../stores/command'
import { 
  CopyDocument, 
  More, 
  View, 
  Edit, 
  CaretRight, 
  DocumentCopy, 
  Delete, 
  Setting,
  TrendCharts,
  Grid
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  command: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['copy', 'execute', 'build', 'detail', 'edit', 'delete', 'duplicate', 'manageCopy'])

// Store
const commandStore = useCommandStore()

// 显示设置
const displaySettings = computed(() => commandStore.displaySettings)

// 获取默认复制的完整命令
const recentCommandText = computed(() => {
  const defaultCommand = commandStore.getDefaultCopyCommand(props.command.id)
  return defaultCommand || props.command?.command || ''
})

// 显示的命令文本
const displayRecentCommand = computed(() => {
  return recentCommandText.value || '点击构建命令'
})

// 分类名称
const categoryName = computed(() => {
  const category = commandStore.categories.find(cat => cat.id === props.command.category)
  return category?.name || props.command.category
})

// 显示的标签（最多3个）
const displayTags = computed(() => {
  return props.command.tags?.slice(0, 3) || []
})

// 额外标签数量
const extraTagsCount = computed(() => {
  const totalTags = props.command.tags?.length || 0
  return Math.max(0, totalTags - 3)
})

// 是否有可选信息需要显示
const hasOptionalInfo = computed(() => {
  return displaySettings.value.showCategory ||
         displaySettings.value.showTags ||
         (displaySettings.value.showUsageStats && props.command.usageCount) ||
         (displaySettings.value.showParameters && hasParameters.value)
})

// 是否有参数
const hasParameters = computed(() => {
  return props.command.parameters?.length > 0 || 
         (props.command.command && props.command.command.includes('{{'))
})

// 参数数量
const parameterCount = computed(() => {
  if (props.command.parameters?.length) {
    return props.command.parameters.length
  }
  // 如果没有参数定义，从命令中统计占位符数量
  const matches = props.command.command?.match(/\{\{[^}]+\}\}/g) || []
  return matches.length
})

// 卡片点击处理
const handleCardClick = () => {
  if (!recentCommandText.value) {
    // 如果没有默认完整命令，打开构建器
    emit('build', props.command)
  } else {
    // 有默认完整命令，执行复制
    handleCopyRecentCommand()
  }
}

// 卡片双击处理
const handleCardDoubleClick = () => {
  if (!recentCommandText.value) {
    // 如果没有默认完整命令，打开构建器
    emit('build', props.command)
  } else {
    // 有默认完整命令，打开构建器
    emit('build', props.command)
  }
}

// 复制命令处理
const handleCopyRecentCommand = (e) => {
  if (e) {
    e.stopPropagation()
  }
  if (recentCommandText.value) {
    emit('copy', recentCommandText.value)
  } else {
    // 如果没有默认完整命令，打开构建器
    emit('build', props.command)
  }
}

const handleBuild = () => {
  emit('build', props.command)
}

const handleDetail = () => {
  emit('detail', props.command)
}

const handleEdit = () => {
  emit('edit', props.command)
}

const handleExecute = () => {
  emit('execute', props.command)
}

const handleDuplicate = () => {
  emit('duplicate', props.command)
}

const handleDelete = () => {
  emit('delete', props.command)
}

const handleManageCopy = () => {
  emit('manageCopy', props.command)
}
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
    
    // 添加没有命令时的样式
    &:empty::before {
      content: '点击构建命令';
      color: var(--el-text-color-secondary);
      font-style: italic;
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