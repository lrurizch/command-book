<template>
  <div 
    class="command-card" 
    :class="{ 'is-user-created': command.isUserCreated }"
    @click="handleCardClick"
  >
    <div class="card-header">
      <div class="command-info">
        <h4 class="command-name">
          {{ command.name }}
          <el-tag v-if="command.isUserCreated" size="small" type="warning">自定义</el-tag>
        </h4>
        <p class="command-desc">{{ command.description }}</p>
      </div>
      
      <!-- 参数统计显示 -->
      <div class="param-stats" v-if="command.parameterStats">
        <el-tooltip content="参数统计" placement="top">
          <div class="stats-summary">
            <el-icon><Grid /></el-icon>
            <span>{{ command.parameterStats.total }}</span>
            <div class="stats-detail">
              <el-tag v-if="command.parameterStats.required > 0" size="small" type="danger">
                必选{{ command.parameterStats.required }}
              </el-tag>
              <el-tag v-if="command.parameterStats.optional > 0" size="small" type="success">
                可选{{ command.parameterStats.optional }}
              </el-tag>
              <el-tag v-if="command.parameterStats.optionLevel > 0" size="small" type="info">
                选项{{ command.parameterStats.optionLevel }}
              </el-tag>
            </div>
          </div>
        </el-tooltip>
      </div>
      
      <div class="card-actions">
        <el-button-group size="small">
          <el-tooltip content="复制命令" placement="top">
            <el-button @click.stop="handleCopy" :icon="CopyDocument" />
          </el-tooltip>
          
          <el-tooltip content="智能构建" placement="top">
            <el-button @click.stop="handleBuild" :icon="Setting" type="primary" />
          </el-tooltip>
          
          <el-tooltip content="快速执行" placement="top">
            <el-button @click.stop="handleExecute" :icon="CaretRight" type="success" />
          </el-tooltip>
          
          <el-dropdown @click.stop placement="bottom-end" trigger="click">
            <el-button :icon="More" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleDetail" :icon="View">
                  查看详情
                </el-dropdown-item>
                <el-dropdown-item @click="handleEdit" :icon="Edit">
                  编辑命令
                </el-dropdown-item>
                <el-dropdown-item @click="handleDuplicate" :icon="DocumentCopy">
                  复制为新命令
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleDelete" :icon="Delete">
                  <span style="color: var(--el-color-danger)">删除命令</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-button-group>
      </div>
    </div>
    
    <div class="card-body">
      <div class="command-preview">
        <code>{{ command.command }}</code>
      </div>
      
      <!-- 增强的参数信息显示 -->
      <div class="enhanced-params" v-if="enhancedCommand.parameters && enhancedCommand.parameters.length > 0">
        <div class="param-categories">
          <div v-if="requiredParams.length > 0" class="param-category required">
            <el-tag size="small" type="danger" effect="light">
              <el-icon><Star /></el-icon>
              必选参数 ({{ requiredParams.length }})
            </el-tag>
            <div class="param-list">
              <span v-for="param in requiredParams.slice(0, 3)" :key="param.name" class="param-name">
                {{ param.name }}
              </span>
              <span v-if="requiredParams.length > 3" class="param-more">
                +{{ requiredParams.length - 3 }}
              </span>
            </div>
          </div>
          
          <div v-if="optionalParams.length > 0" class="param-category optional">
            <el-tag size="small" type="success" effect="light">
              <el-icon><Grid /></el-icon>
              可选参数 ({{ optionalParams.length }})
            </el-tag>
            <div class="param-list">
              <span v-for="param in optionalParams.slice(0, 3)" :key="param.name" class="param-name">
                {{ param.name }}
              </span>
              <span v-if="optionalParams.length > 3" class="param-more">
                +{{ optionalParams.length - 3 }}
              </span>
            </div>
          </div>
          
          <div v-if="optionLevelParams.length > 0" class="param-category option">
            <el-tag size="small" type="info" effect="light">
              <el-icon><Setting /></el-icon>
              选项参数 ({{ optionLevelParams.length }})
            </el-tag>
            <div class="param-list">
              <span v-for="param in optionLevelParams.slice(0, 3)" :key="param.name" class="param-name">
                {{ param.parentOption }}
              </span>
              <span v-if="optionLevelParams.length > 3" class="param-more">
                +{{ optionLevelParams.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card-footer">
        <div class="command-tags">
          <el-tag 
            v-for="tag in command.tags?.slice(0, 3)" 
            :key="tag" 
            size="small" 
            type="info" 
            effect="plain"
          >
            {{ tag }}
          </el-tag>
          <el-tag v-if="command.tags && command.tags.length > 3" size="small" type="info" effect="plain">
            +{{ command.tags.length - 3 }}
          </el-tag>
        </div>
        
        <div class="command-meta">
          <span v-if="command.usageCount" class="usage-count">
            <el-icon><Histogram /></el-icon>
            {{ command.usageCount }}次
          </span>
          <span v-if="command.lastUsed" class="last-used">
            {{ formatLastUsed(command.lastUsed) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  CopyDocument, 
  Setting, 
  CaretRight, 
  More, 
  View, 
  Edit, 
  DocumentCopy, 
  Delete, 
  Grid, 
  Star, 
  TrendCharts as Histogram
} from '@element-plus/icons-vue'
import { useCommandStore } from '../stores/command'
import { showCopySuccess, showExecuteSuccess, toast } from '../utils/toast'

// Props
const props = defineProps({
  command: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['copy', 'execute', 'build', 'detail', 'edit', 'delete', 'duplicate'])

// Store
const commandStore = useCommandStore()

// 计算属性 - 升级后的命令
const enhancedCommand = computed(() => {
  return commandStore.upgradeCommandParameters(props.command)
})

// 计算属性 - 参数分类
const requiredParams = computed(() => {
  return enhancedCommand.value.parameters?.filter(param => 
    param.required === true && param.level === 'command'
  ) || []
})

const optionalParams = computed(() => {
  return enhancedCommand.value.parameters?.filter(param => 
    param.required === false && param.level === 'command'
  ) || []
})

const optionLevelParams = computed(() => {
  return enhancedCommand.value.parameters?.filter(param => 
    param.level === 'option'
  ) || []
})

// 事件处理方法
const handleCardClick = () => {
  emit('detail', enhancedCommand.value)
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.command.command)
    showCopySuccess()
    commandStore.updateCommandStats(props.command.id)
  } catch (error) {
    toast.error('复制失败: ' + error.message)
  }
}

const handleBuild = () => {
  emit('build', enhancedCommand.value)
}

const handleExecute = () => {
  emit('execute', enhancedCommand.value)
  commandStore.updateCommandStats(props.command.id)
}

const handleDetail = () => {
  emit('detail', enhancedCommand.value)
}

const handleEdit = () => {
  emit('edit', enhancedCommand.value)
}

const handleDuplicate = () => {
  emit('duplicate', enhancedCommand.value)
}

const handleDelete = () => {
  emit('delete', enhancedCommand.value)
}

// 工具函数
const formatLastUsed = (lastUsed) => {
  if (!lastUsed) return ''
  
  const date = new Date(lastUsed)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天使用'
  } else if (diffDays === 1) {
    return '昨天使用'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style lang="scss" scoped>
.command-card {
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: var(--el-box-shadow-light);
  }
  
  &.is-user-created {
    border-left: 4px solid var(--el-color-warning);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .command-info {
      flex: 1;
      min-width: 0;
      
      .command-name {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .command-desc {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.4;
      }
    }
    
    .param-stats {
      margin: 0 12px;
      
      .stats-summary {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        
        .stats-detail {
          display: flex;
          gap: 4px;
          margin-left: 8px;
        }
      }
    }
    
    .card-actions {
      flex-shrink: 0;
    }
  }
  
  .card-body {
    .command-preview {
      margin-bottom: 12px;
      
      code {
        display: block;
        padding: 8px 12px;
        background: var(--el-fill-color-light);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: var(--el-border-radius-small);
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 13px;
        color: var(--el-text-color-primary);
        word-break: break-all;
        white-space: pre-wrap;
      }
    }
    
    .enhanced-params {
      margin-bottom: 12px;
      
      .param-categories {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .param-category {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          
          .param-list {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            
            .param-name {
              font-size: 11px;
              padding: 2px 6px;
              background: var(--el-fill-color-light);
              border-radius: var(--el-border-radius-small);
              color: var(--el-text-color-secondary);
            }
            
            .param-more {
              font-size: 11px;
              color: var(--el-text-color-placeholder);
            }
          }
          
          &.required .param-name {
            background: var(--el-color-danger-light-9);
            color: var(--el-color-danger);
          }
          
          &.optional .param-name {
            background: var(--el-color-success-light-9);
            color: var(--el-color-success);
          }
          
          &.option .param-name {
            background: var(--el-color-info-light-9);
            color: var(--el-color-info);
          }
        }
      }
    }
    
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .command-tags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        flex: 1;
      }
      
      .command-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--el-text-color-placeholder);
        
        .usage-count {
          display: flex;
          align-items: center;
          gap: 2px;
        }
      }
    }
  }
}
</style> 