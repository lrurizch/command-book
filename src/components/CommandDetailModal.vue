<template>
  <el-dialog
    v-model="dialogVisible"
    title="命令详情"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="command" class="command-detail">
      <!-- 基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <div class="detail-item">
          <label>命令名称：</label>
          <span class="value">{{ command.name }}</span>
        </div>
        <div class="detail-item">
          <label>命令内容：</label>
          <div class="command-code-display">
            <pre><code>{{ command.command }}</code></pre>
          </div>
        </div>
        <div class="detail-item" v-if="command.description">
          <label>命令描述：</label>
          <span class="value">{{ command.description }}</span>
        </div>
      </div>

      <!-- 分类和标签 -->
      <div class="detail-section">
        <h3 class="section-title">分类和标签</h3>
        <div class="detail-item">
          <label>所属分类：</label>
          <span class="category-tag" :style="{ color: categoryColor }">
            {{ categoryName }}
          </span>
        </div>
        <div class="detail-item" v-if="command.tags && command.tags.length">
          <label>标签：</label>
          <div class="tags-display">
            <span
              v-for="tag in command.tags"
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- 参数信息 -->
      <div class="detail-section" v-if="command.parameters && command.parameters.length">
        <h3 class="section-title">参数信息</h3>
        <div class="parameters-list">
          <div
            v-for="param in command.parameters"
            :key="param.name"
            class="parameter-item"
          >
            <div class="param-header">
              <span class="param-name">{{ param.name }}</span>
              <span class="param-required" v-if="param.required">必填</span>
            </div>
            <div class="param-description" v-if="param.description">
              {{ param.description }}
            </div>
            <div class="param-default" v-if="param.defaultValue">
              默认值：{{ param.defaultValue }}
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="detail-section">
        <h3 class="section-title">统计信息</h3>
        <div class="detail-item">
          <label>使用次数：</label>
          <span class="value">{{ command.usageCount || 0 }} 次</span>
        </div>
        <div class="detail-item" v-if="command.createdAt">
          <label>创建时间：</label>
          <span class="value">{{ formatDate(command.createdAt) }}</span>
        </div>
        <div class="detail-item" v-if="command.updatedAt">
          <label>更新时间：</label>
          <span class="value">{{ formatDate(command.updatedAt) }}</span>
        </div>
        <div class="detail-item" v-if="command.lastUsedAt">
          <label>最后使用：</label>
          <span class="value">{{ formatDate(command.lastUsedAt) }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleEdit">修改命令</el-button>
        <el-button type="success" @click="handleExecute">执行命令</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { useCommandStore } from '../stores/command'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  command: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'edit', 'execute'])

const commandStore = useCommandStore()
const dialogVisible = ref(false)

// 同步 visible 状态
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 计算属性
const categoryName = computed(() => {
  if (!props.command) return ''
  const category = commandStore.categories.find(cat => cat.id === props.command.category)
  return category ? category.name : '未分类'
})

const categoryColor = computed(() => {
  if (!props.command) return '#909399'
  const category = commandStore.categories.find(cat => cat.id === props.command.category)
  return category ? category.color || '#409EFF' : '#909399'
})

// 方法
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleEdit = () => {
  emit('edit', props.command)
  handleClose()
}

const handleExecute = () => {
  emit('execute', props.command)
  handleClose()
}
</script>

<style lang="scss" scoped>
.command-detail {
  .detail-section {
    margin-bottom: var(--el-spacing-xl);
    
    .section-title {
      margin: 0 0 var(--el-spacing-md) 0;
      font-size: var(--el-font-size-large);
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--el-border-color-light);
      padding-bottom: var(--el-spacing-sm);
    }
    
    .detail-item {
      margin-bottom: var(--el-spacing-md);
      display: flex;
      align-items: flex-start;
      
      label {
        min-width: 80px;
        font-weight: 500;
        color: var(--el-text-color-regular);
        margin-right: var(--el-spacing-md);
      }
      
      .value {
        flex: 1;
        color: var(--el-text-color-primary);
        word-break: break-all;
      }
      
      .category-tag {
        font-weight: 600;
        padding: 2px 8px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: var(--el-border-radius-small);
      }
    }
  }
}

.command-code-display {
  flex: 1;
  
  pre {
    margin: 0;
    background: var(--el-fill-color-light);
    padding: var(--el-padding-md);
    border-radius: var(--el-border-radius-base);
    border: 1px solid var(--el-border-color-light);
    
    code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: var(--el-font-size-small);
      line-height: 1.6;
      color: var(--el-text-color-primary);
      word-break: break-all;
    }
  }
}

.tags-display {
  display: flex;
  gap: var(--el-spacing-xs);
  flex-wrap: wrap;
  
  .tag {
    font-size: var(--el-font-size-small);
    padding: 2px 8px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    border-radius: var(--el-border-radius-small);
  }
}

.parameters-list {
  .parameter-item {
    padding: var(--el-padding-md);
    background: var(--el-fill-color-extra-light);
    border-radius: var(--el-border-radius-base);
    margin-bottom: var(--el-spacing-md);
    
    .param-header {
      display: flex;
      align-items: center;
      gap: var(--el-spacing-sm);
      margin-bottom: var(--el-spacing-sm);
      
      .param-name {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .param-required {
        font-size: var(--el-font-size-small);
        color: var(--el-color-danger);
        background: var(--el-color-danger-light-9);
        padding: 1px 6px;
        border-radius: var(--el-border-radius-small);
      }
    }
    
    .param-description,
    .param-default {
      font-size: var(--el-font-size-small);
      color: var(--el-text-color-secondary);
      margin-bottom: var(--el-spacing-xs);
    }
    
    .param-default {
      color: var(--el-color-primary);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--el-spacing-sm);
}
</style> 