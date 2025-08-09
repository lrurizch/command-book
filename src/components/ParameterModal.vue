<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal parameter-modal card">
      <div class="modal-header card-header">
        <h3 class="modal-title">执行命令: {{ command.name }}</h3>
        <button class="modal-close btn btn-sm btn-secondary" @click="$emit('cancel')">
          ✕
        </button>
      </div>
      
      <div class="modal-body card-body">
        <div class="command-preview">
          <div class="preview-label">命令预览:</div>
          <pre class="preview-code"><code>{{ previewCommand }}</code></pre>
        </div>
        
        <form @submit.prevent="handleSubmit" class="parameter-form">
          <div
            v-for="param in command.parameters"
            :key="param.name"
            class="form-group"
          >
            <label :for="`param-${param.name}`" class="form-label">
              {{ param.name }}
              <span v-if="param.required" class="required-mark">*</span>
            </label>
            
            <input
              :id="`param-${param.name}`"
              v-model="parameterValues[param.name]"
              type="text"
              class="form-input input"
              :placeholder="param.defaultValue || `请输入${param.name}`"
              :required="param.required"
              @input="updatePreview"
            >
            
            <div v-if="param.description" class="param-description">
              {{ param.description }}
            </div>
            
            <div v-if="param.required && !parameterValues[param.name]" class="param-error">
              此参数为必填项
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer card-footer">
        <div class="footer-actions">
          <button class="btn btn-secondary" @click="$emit('cancel')">
            取消 (Esc)
          </button>
          <button
            class="btn btn-primary"
            @click="handleSubmit"
            :disabled="!isFormValid"
          >
            执行命令 (Enter)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  command: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

// 响应式数据
const parameterValues = ref({})

// 计算属性
const previewCommand = computed(() => {
  let cmd = props.command.command
  
  // 替换参数占位符
  Object.entries(parameterValues.value).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    const displayValue = value || `<${key}>`
    cmd = cmd.replace(new RegExp(placeholder, 'g'), displayValue)
  })
  
  return cmd
})

const isFormValid = computed(() => {
  // 检查所有必填参数是否已填写
  return props.command.parameters.every(param => {
    if (param.required) {
      return parameterValues.value[param.name] && parameterValues.value[param.name].trim()
    }
    return true
  })
})

// 方法
const initializeParameters = () => {
  const values = {}
  props.command.parameters.forEach(param => {
    values[param.name] = param.defaultValue || ''
  })
  parameterValues.value = values
}

const updatePreview = () => {
  // 触发预览更新（通过computed属性自动处理）
}

const handleSubmit = () => {
  if (isFormValid.value) {
    // 过滤空值参数
    const finalParams = {}
    Object.entries(parameterValues.value).forEach(([key, value]) => {
      if (value && value.trim()) {
        finalParams[key] = value.trim()
      }
    })
    
    emit('confirm', finalParams)
  }
}

const handleOverlayClick = (event) => {
  if (event.target === event.currentTarget) {
    emit('cancel')
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      emit('cancel')
      break
    case 'Enter':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        handleSubmit()
      }
      break
  }
}

// 生命周期
onMounted(() => {
  initializeParameters()
  document.addEventListener('keydown', handleKeydown)
  
  // 聚焦第一个输入框
  nextTick(() => {
    const firstInput = document.querySelector('.parameter-form .form-input')
    if (firstInput) {
      firstInput.focus()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

.parameter-modal {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideInUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .modal-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
  }
  
  .modal-close {
    min-width: 32px;
    padding: var(--spacing-xs);
  }
}

.command-preview {
  margin-bottom: var(--spacing-lg);
  
  .preview-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    margin-bottom: var(--spacing-sm);
    color: var(--text-secondary);
  }
  
  .preview-code {
    background: var(--bg-dark);
    color: var(--text-light);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: var(--font-size-sm);
    line-height: 1.4;
    overflow-x: auto;
    margin: 0;
    
    code {
      background: none;
      padding: 0;
      color: inherit;
    }
  }
}

.parameter-form {
  .form-group {
    margin-bottom: var(--spacing-lg);
    
    .form-label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: 600;
      margin-bottom: var(--spacing-sm);
      color: var(--text-primary);
      
      .required-mark {
        color: var(--danger-color);
        margin-left: var(--spacing-xs);
      }
    }
    
    .form-input {
      width: 100%;
      
      &:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
      }
      
      &:invalid {
        border-color: var(--danger-color);
      }
    }
    
    .param-description {
      margin-top: var(--spacing-xs);
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      line-height: 1.4;
    }
    
    .param-error {
      margin-top: var(--spacing-xs);
      font-size: var(--font-size-xs);
      color: var(--danger-color);
    }
  }
}

.modal-footer {
  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    
    .btn {
      min-width: 100px;
    }
  }
}

// 动画
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .parameter-modal {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-footer .footer-actions {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
}
</style> 