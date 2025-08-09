<template>
  <div class="execution-history card">
    <div class="card-header">
      <h3>执行历史</h3>
      <button
        v-if="history.length > 0"
        class="btn btn-sm btn-secondary"
        @click="clearHistory"
      >
        清除历史
      </button>
    </div>
    
    <div class="card-body">
      <div v-if="history.length === 0" class="empty-history">
        <div class="empty-icon">📊</div>
        <div class="empty-text">暂无执行历史</div>
      </div>
      
      <div v-else class="history-list">
        <div
          v-for="execution in history"
          :key="execution.id"
          class="execution-item"
          :class="`status-${execution.status}`"
        >
          <div class="execution-header">
            <div class="execution-info">
              <div class="execution-time">
                {{ formatDate(execution.startTime) }}
              </div>
              <div class="execution-duration" v-if="execution.duration">
                耗时: {{ formatDuration(execution.duration) }}
              </div>
            </div>
            <div class="execution-status">
              <span class="status-badge" :class="`status-${execution.status}`">
                {{ getStatusText(execution.status) }}
              </span>
            </div>
          </div>
          
          <div class="execution-steps">
            <div
              v-for="(step, index) in execution.steps"
              :key="index"
              class="step-item"
              :class="`step-${step.status}`"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <div class="step-name">{{ step.stepName }}</div>
                <div v-if="step.command" class="step-command">
                  <code>{{ step.command }}</code>
                </div>
                <div v-if="step.error" class="step-error">
                  ❌ {{ step.error }}
                </div>
                <div v-if="step.reason" class="step-reason">
                  ℹ️ {{ step.reason }}
                </div>
              </div>
              <div class="step-status">
                <span class="step-icon">{{ getStepIcon(step.status) }}</span>
                <span v-if="step.duration" class="step-duration">
                  {{ formatDuration(step.duration) }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="execution.error" class="execution-error">
            <strong>执行失败:</strong> {{ execution.error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWorkflowStore } from '../stores/workflow'

const props = defineProps({
  workflowId: {
    type: String,
    default: null
  }
})

const workflowStore = useWorkflowStore()

// 计算属性
const history = computed(() => {
  return workflowStore.getExecutionHistory(props.workflowId)
})

// 方法
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  // 如果是今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  // 如果是昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 其他日期
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (duration) => {
  if (duration < 1000) {
    return `${duration}ms`
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m${seconds}s`
  }
}

const getStatusText = (status) => {
  const statusMap = {
    completed: '完成',
    failed: '失败',
    running: '运行中'
  }
  return statusMap[status] || status
}

const getStepIcon = (status) => {
  const iconMap = {
    completed: '✅',
    failed: '❌',
    running: '⏳',
    skipped: '⏭️'
  }
  return iconMap[status] || '⚪'
}

const clearHistory = () => {
  workflowStore.clearExecutionHistory(props.workflowId)
  if (window.utoolsSystem) {
    window.utoolsSystem.showNotification('执行历史已清除')
  }
}
</script>

<style lang="scss" scoped>
.execution-history {
  margin-top: var(--spacing-lg);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: 600;
    }
  }
}

.empty-history {
  text-align: center;
  padding: var(--spacing-xl);
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
  }
  
  .empty-text {
    color: var(--text-muted);
    font-size: var(--font-size-base);
  }
}

.history-list {
  .execution-item {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-md);
    overflow: hidden;
    
    &.status-completed {
      border-left: 4px solid var(--success-color);
    }
    
    &.status-failed {
      border-left: 4px solid var(--danger-color);
    }
    
    &.status-running {
      border-left: 4px solid var(--warning-color);
    }
    
    .execution-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      
      .execution-info {
        .execution-time {
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }
        
        .execution-duration {
          font-size: var(--font-size-sm);
          color: var(--text-muted);
        }
      }
      
      .execution-status {
        .status-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--border-radius);
          font-size: var(--font-size-xs);
          font-weight: 600;
          
          &.status-completed {
            background: rgba(40, 167, 69, 0.1);
            color: var(--success-color);
          }
          
          &.status-failed {
            background: rgba(220, 53, 69, 0.1);
            color: var(--danger-color);
          }
          
          &.status-running {
            background: rgba(255, 193, 7, 0.1);
            color: var(--warning-color);
          }
        }
      }
    }
    
    .execution-steps {
      padding: var(--spacing-md);
      
      .step-item {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .step-number {
          width: 24px;
          height: 24px;
          background: var(--bg-secondary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-xs);
          font-weight: 600;
          flex-shrink: 0;
        }
        
        &.step-completed .step-number {
          background: var(--success-color);
          color: var(--text-light);
        }
        
        &.step-failed .step-number {
          background: var(--danger-color);
          color: var(--text-light);
        }
        
        &.step-running .step-number {
          background: var(--warning-color);
          color: var(--text-light);
        }
        
        &.step-skipped .step-number {
          background: var(--secondary-color);
          color: var(--text-light);
        }
        
        .step-content {
          flex: 1;
          
          .step-name {
            font-weight: 600;
            margin-bottom: var(--spacing-xs);
          }
          
          .step-command {
            margin-bottom: var(--spacing-xs);
            
            code {
              background: var(--bg-dark);
              color: var(--text-light);
              padding: var(--spacing-xs) var(--spacing-sm);
              border-radius: var(--border-radius);
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: var(--font-size-xs);
            }
          }
          
          .step-error {
            color: var(--danger-color);
            font-size: var(--font-size-sm);
            background: rgba(220, 53, 69, 0.1);
            padding: var(--spacing-sm);
            border-radius: var(--border-radius);
            margin-bottom: var(--spacing-xs);
          }
          
          .step-reason {
            color: var(--info-color);
            font-size: var(--font-size-sm);
            background: rgba(23, 162, 184, 0.1);
            padding: var(--spacing-sm);
            border-radius: var(--border-radius);
          }
        }
        
        .step-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          
          .step-icon {
            font-size: var(--font-size-base);
          }
          
          .step-duration {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
          }
        }
      }
    }
    
    .execution-error {
      padding: var(--spacing-md);
      background: rgba(220, 53, 69, 0.1);
      color: var(--danger-color);
      border-top: 1px solid var(--border-color);
      font-size: var(--font-size-sm);
    }
  }
}

@media (max-width: 768px) {
  .execution-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .step-item {
    flex-direction: column;
    
    .step-status {
      align-self: flex-end;
      flex-direction: row;
    }
  }
}
</style> 