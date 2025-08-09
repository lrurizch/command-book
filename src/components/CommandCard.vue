<template>
  <div 
    class="command-card" 
    :class="{ 'is-user-created': command.isUserCreated }"
    @click="handleCopyRecentCommand"
    @dblclick.stop="handleBuild"
  >
    <!-- 简化的命令卡片布局 -->
    <div class="card-content" :class="{ 'compact-mode': displaySettings.compactMode }">
      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 命令名称 (可选显示) -->
        <div v-if="displaySettings.showCommandName" class="command-name">
          {{ command.name }}
          <el-tag v-if="command.isUserCreated" size="small" type="warning">自定义</el-tag>
        </div>
        
        <!-- 完整命令 (始终显示) -->
        <div class="command-display">
          <el-tooltip :content="recentCommandText" placement="top" :disabled="!recentCommandText">
            <code class="command-text">{{ displayRecentCommand }}</code>
          </el-tooltip>
        </div>
        
        <!-- 描述 (可选显示) -->
        <div v-if="displaySettings.showDescription" class="command-desc">
          {{ command.description }}
        </div>
      </div>
      
      <!-- 可选信息区域 -->
      <div v-if="hasOptionalInfo" class="optional-info">
        <!-- 分类 -->
        <div v-if="displaySettings.showCategory" class="info-item">
          <el-tag type="info" size="small">{{ categoryName }}</el-tag>
        </div>
        
        <!-- 标签 -->
        <div v-if="displaySettings.showTags" class="info-item tags-container">
          <el-tag 
            v-for="tag in displayTags" 
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
        
        <!-- 使用统计 -->
        <div v-if="displaySettings.showUsageStats && command.usageCount" class="info-item">
          <span class="usage-stats">
            <el-icon><TrendCharts /></el-icon>
            使用 {{ command.usageCount }} 次
          </span>
        </div>
        
        <!-- 参数信息 -->
        <div v-if="displaySettings.showParameters && hasParameters" class="info-item">
          <span class="parameter-info">
            <el-icon><Grid /></el-icon>
            {{ parameterCount }} 个参数
          </span>
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
  // 如果没有命令数据，返回空
  if (!props.command) {
    return '暂无命令'
  }
  
  // 优先使用用户手动设置的默认复制命令
  const defaultCopy = commandStore.getDefaultCopyCommand(props.command.id)
  if (defaultCopy) {
    return defaultCopy
  }
  
  // 否则使用最近的构建命令
  const buildHistory = commandStore.buildHistory || []
  const recentBuild = buildHistory
    .filter(item => item.templateId === props.command.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
  
  // 最后回退到原始命令模板
  return recentBuild?.finalCommand || props.command.command || '暂无命令'
})

// 显示的最近命令（截断长命令）
const displayRecentCommand = computed(() => {
  const maxLength = 80
  const cmd = recentCommandText.value || ''
  return cmd.length > maxLength ? cmd.substring(0, maxLength) + '...' : cmd
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

// 事件处理器
const handleCopyRecentCommand = () => {
  const textToCopy = recentCommandText.value || props.command?.command || '暂无命令'
  navigator.clipboard.writeText(textToCopy)
  emit('copy', textToCopy)
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

<style scoped>
.command-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.command-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.command-card.is-user-created {
  border-left: 4px solid var(--el-color-warning);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-content.compact-mode {
  gap: 8px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
}

.command-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact-mode .command-name {
  font-size: 14px;
  margin-bottom: 4px;
}

.command-display {
  margin-bottom: 6px;
}

.command-text {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 10px 12px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  color: var(--el-text-color-primary);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  line-height: 1.4;
}

.compact-mode .command-text {
  padding: 6px 10px;
  font-size: 13px;
}

.command-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.compact-mode .command-desc {
  font-size: 12px;
}

/* 可选信息区域 */
.optional-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-item {
  margin: 0;
}

.usage-stats,
.parameter-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 操作按钮区域 */
.actions-section {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-top: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .command-text {
    font-size: 13px;
  }
  
  .actions-section {
    justify-content: center;
  }
}
</style> 