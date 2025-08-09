<template>
  <div v-if="visible" class="modal-overlay" @click="onCancel">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>批量新增命令</h3>
        <button class="close-btn" @click="onCancel">×</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">输入格式说明</label>
          <div class="help-text">
            <p>每行一个命令，格式：<code>命令内容 | 描述 | 分类 | 标签1,标签2</code></p>
            <p>示例：</p>
            <pre>git status | 查看Git仓库状态 | git-basic | git,状态
git add . | 添加所有文件到暂存区 | git-basic | git,添加
docker ps | 查看运行中的容器 | docker | docker,容器</pre>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">批量命令 ({{ commandCount }} 个命令)</label>
          <textarea
            v-model="batchText"
            class="form-textarea"
            placeholder="请输入要批量添加的命令，每行一个..."
            rows="12"
            @input="updateCommandCount"
          ></textarea>
        </div>
        
        <div v-if="parseErrors.length > 0" class="error-section">
          <h4>格式错误 ({{ parseErrors.length }} 行)</h4>
          <ul class="error-list">
            <li v-for="error in parseErrors" :key="error.line">
              第 {{ error.line }} 行: {{ error.message }}
            </li>
          </ul>
        </div>
        
        <div v-if="previewCommands.length > 0" class="preview-section">
          <h4>预览 (前5个命令)</h4>
          <div class="preview-list">
            <div 
              v-for="(cmd, index) in previewCommands.slice(0, 5)" 
              :key="index"
              class="preview-item"
            >
              <div class="preview-command">{{ cmd.command }}</div>
              <div class="preview-details">
                <span class="preview-description">{{ cmd.description }}</span>
                <span class="preview-category">{{ getCategoryName(cmd.category) }}</span>
                <span class="preview-tags">{{ cmd.tags.join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="onCancel">取消</button>
        <button 
          class="btn btn-success" 
          :disabled="!canCreate"
          @click="onConfirm"
        >
          添加 {{ validCommandCount }} 个命令
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommandStore } from '../stores/command'

const commandStore = useCommandStore()

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'confirm'])

const batchText = ref('')
const commandCount = ref(0)
const parseErrors = ref([])
const previewCommands = ref([])

// 解析批量文本
const parseBatchText = () => {
  const lines = batchText.value.split('\n').filter(line => line.trim())
  const errors = []
  const commands = []
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const trimmedLine = line.trim()
    
    if (!trimmedLine) return
    
    const parts = trimmedLine.split('|').map(part => part.trim())
    
    if (parts.length < 2) {
      errors.push({
        line: lineNumber,
        message: '格式错误，至少需要命令和描述，用 | 分隔'
      })
      return
    }
    
    const [command, description, category = 'all', tagsStr = ''] = parts
    
    if (!command) {
      errors.push({
        line: lineNumber,
        message: '命令内容不能为空'
      })
      return
    }
    
    if (!description) {
      errors.push({
        line: lineNumber,
        message: '命令描述不能为空'
      })
      return
    }
    
    // 检查分类是否存在
    const categoryExists = commandStore.categories.find(cat => cat.id === category)
    if (category !== 'all' && !categoryExists) {
      errors.push({
        line: lineNumber,
        message: `分类 "${category}" 不存在，将使用默认分类`
      })
    }
    
    const tags = tagsStr ? tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    
    commands.push({
      command: command.trim(),
      description: description.trim(),
      usage: '',
      category: categoryExists ? category : 'all',
      tags,
      parameters: []
    })
  })
  
  parseErrors.value = errors
  previewCommands.value = commands
}

// 更新命令数量
const updateCommandCount = () => {
  const lines = batchText.value.split('\n').filter(line => line.trim())
  commandCount.value = lines.length
  parseBatchText()
}

// 有效命令数量
const validCommandCount = computed(() => previewCommands.value.length)

// 是否可以创建
const canCreate = computed(() => validCommandCount.value > 0)

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = commandStore.categories.find(cat => cat.id === categoryId)
  return category ? category.name : '未知分类'
}

// 监听visible变化，重置数据
watch(() => props.visible, (visible) => {
  if (visible) {
    batchText.value = ''
    commandCount.value = 0
    parseErrors.value = []
    previewCommands.value = []
  }
})

const onConfirm = () => {
  if (canCreate.value) {
    emit('confirm', previewCommands.value)
  }
}

const onCancel = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  
  h3 {
    margin: 0;
    color: var(--text-primary);
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background: var(--bg-hover);
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
}

.help-text {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  
  p {
    margin: 8px 0;
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  code {
    background: var(--bg-primary);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
  }
  
  pre {
    background: var(--bg-primary);
    padding: 8px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    overflow-x: auto;
    margin: 8px 0;
  }
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.1);
  }
}

.error-section {
  margin-bottom: 20px;
  
  h4 {
    margin: 0 0 12px 0;
    color: var(--danger-color);
    font-size: 16px;
  }
}

.error-list {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 12px;
  margin: 0;
  
  li {
    color: #dc2626;
    font-size: 14px;
    margin-bottom: 4px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.preview-section {
  margin-bottom: 20px;
  
  h4 {
    margin: 0 0 12px 0;
    color: var(--text-primary);
    font-size: 16px;
  }
}

.preview-list {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 12px;
}

.preview-item {
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
}

.preview-command {
  font-family: 'Consolas', 'Monaco', monospace;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.preview-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  
  .preview-description {
    color: var(--text-secondary);
    flex: 1;
  }
  
  .preview-category {
    color: var(--color-primary);
    font-weight: 500;
  }
  
  .preview-tags {
    color: var(--text-tertiary);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &.btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    
    &:hover {
      background: var(--bg-hover);
    }
  }
  
  &.btn-success {
    background: #10b981;
    color: white;
    
    &:hover:not(:disabled) {
      background: #059669;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style> 