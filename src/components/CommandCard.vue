<template>
  <div 
    class="command-card" 
    :class="{ 'is-user-created': command.isUserCreated }"
    @click="handleCopyRecentCommand"
    @dblclick.stop="handleBuild"
  >
    <!-- 新的水平布局：从左到右 -->
    <div class="card-content">
      <!-- 最近使用的完整命令 (左侧，占主要空间) -->
      <div class="recent-command-section">
        <div class="command-name">
          {{ command.name }}
          <el-tag v-if="command.isUserCreated" size="small" type="warning">自定义</el-tag>
        </div>
        <div class="recent-command">
          <el-tooltip :content="recentCommandText" placement="top" :disabled="!recentCommandText">
            <code class="command-text">{{ displayRecentCommand }}</code>
          </el-tooltip>
        </div>
        <div class="command-desc">{{ command.description }}</div>
      </div>
      
      <!-- 分类 (中左) -->
      <div class="category-section">
        <el-tag type="info" size="small">
          {{ categoryName }}
        </el-tag>
      </div>
      
      <!-- 标签 (中右) -->
      <div class="tags-section">
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
      
      <!-- 操作按钮 (最右侧) -->
      <div class="actions-section">
        <el-tooltip content="单击复制最近命令，双击进入构建器" placement="top">
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
  Setting 
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

// 获取默认复制的完整命令
const recentCommandText = computed(() => {
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
  
  // 确保返回有效的命令文本
  return recentBuild?.finalCommand || props.command?.command || '暂无命令'
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
  align-items: center;
  gap: 16px;
}

/* 最近命令区域 (左侧，主要空间) */
.recent-command-section {
  flex: 1;
  min-width: 0; /* 允许内容收缩 */
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

.recent-command {
  margin-bottom: 6px;
}

.command-text {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 8px 12px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  color: var(--el-text-color-regular);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.command-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

/* 分类区域 (中左) */
.category-section {
  flex-shrink: 0;
  min-width: 80px;
}

/* 标签区域 (中右) */
.tags-section {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 120px;
  max-width: 200px;
}

.tag-item {
  margin: 0;
}

/* 操作按钮区域 (最右侧) */
.actions-section {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .tags-section {
    max-width: 150px;
  }
}

@media (max-width: 900px) {
  .card-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .recent-command-section {
    order: 1;
  }
  
  .category-section {
    order: 2;
    align-self: flex-start;
  }
  
  .tags-section {
    order: 3;
    max-width: none;
  }
  
  .actions-section {
    order: 4;
    justify-content: flex-end;
  }
}
</style> 