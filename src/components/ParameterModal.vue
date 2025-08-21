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
              <span v-if="param.repeatable" class="repeatable-mark">🔄</span>
            </label>
            
            <!-- 可重复参数的多值输入 -->
            <div v-if="param.repeatable" class="repeatable-input-container">
              <div
                v-for="(value, index) in getRepeatableValues(param.name)"
                :key="index"
                class="repeatable-input-row"
              >
                <input
                  :id="`param-${param.name}-${index}`"
                  v-model="repeatableValues[param.name][index]"
                  type="text"
                  class="form-input input repeatable-input"
                  :placeholder="param.defaultValue || `请输入${param.name} ${index + 1}`"
                  :required="param.required && index === 0"
                  @input="updateRepeatableValues(param.name)"
                >
                <button
                  v-if="getRepeatableValues(param.name).length > 1"
                  type="button"
                  class="btn btn-sm btn-danger remove-value-btn"
                  @click="removeRepeatableValue(param.name, index)"
                  title="删除此值"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-secondary add-value-btn"
                @click="addRepeatableValue(param.name)"
              >
                + 添加值
              </button>
            </div>
            
            <!-- 普通参数的单值输入 -->
            <input
              v-else
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
              <span v-if="param.repeatable" class="repeatable-hint">（可填写多个值，用空格分隔）</span>
            </div>
            
            <div v-if="param.required && !hasValidValue(param)" class="param-error">
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
const repeatableValues = ref({})

// 计算属性
const previewCommand = computed(() => {
  let cmd = props.command.command
  
  // 替换参数占位符
  props.command.parameters.forEach(param => {
    const placeholder = `{{${param.name}}}`
    let displayValue = ''
    
    if (param.repeatable) {
      // 可重复参数：合并所有非空值
      const values = repeatableValues.value[param.name] || []
      const nonEmptyValues = values.filter(v => v && v.trim())
      displayValue = nonEmptyValues.length > 0 ? nonEmptyValues.join(' ') : `<${param.name}>`
    } else {
      // 普通参数
      displayValue = parameterValues.value[param.name] || `<${param.name}>`
    }
    
    cmd = cmd.replace(new RegExp(placeholder, 'g'), displayValue)
  })
  
  return cmd
})

const isFormValid = computed(() => {
  // 检查所有必填参数是否已填写
  return props.command.parameters.every(param => {
    if (param.required) {
      return hasValidValue(param)
    }
    return true
  })
})

// 方法
const initializeParameters = () => {
  const values = {}
  const repeatable = {}
  
  props.command.parameters.forEach(param => {
    if (param.repeatable) {
      // 可重复参数：初始化为包含一个空值的数组
      repeatable[param.name] = [param.defaultValue || '']
    } else {
      // 普通参数
      values[param.name] = param.defaultValue || ''
    }
  })
  
  parameterValues.value = values
  repeatableValues.value = repeatable
}

const updatePreview = () => {
  // 触发预览更新（通过computed属性自动处理）
}

// 可重复参数相关方法
const getRepeatableValues = (paramName) => {
  return repeatableValues.value[paramName] || ['']
}

const addRepeatableValue = (paramName) => {
  if (!repeatableValues.value[paramName]) {
    repeatableValues.value[paramName] = ['']
  }
  repeatableValues.value[paramName].push('')
}

const removeRepeatableValue = (paramName, index) => {
  if (repeatableValues.value[paramName] && repeatableValues.value[paramName].length > 1) {
    repeatableValues.value[paramName].splice(index, 1)
  }
}

const updateRepeatableValues = (paramName) => {
  // 触发响应式更新
  repeatableValues.value = { ...repeatableValues.value }
}

const hasValidValue = (param) => {
  if (param.repeatable) {
    const values = repeatableValues.value[param.name] || []
    return values.some(v => v && v.trim())
  } else {
    return parameterValues.value[param.name] && parameterValues.value[param.name].trim()
  }
}

const handleSubmit = () => {
  if (isFormValid.value) {
    // 合并普通参数和可重复参数
    const finalParams = {}
    
    // 处理普通参数
    Object.entries(parameterValues.value).forEach(([key, value]) => {
      if (value && value.trim()) {
        finalParams[key] = value.trim()
      }
    })
    
    // 处理可重复参数
    Object.entries(repeatableValues.value).forEach(([key, values]) => {
      const nonEmptyValues = values.filter(v => v && v.trim())
      if (nonEmptyValues.length > 0) {
        finalParams[key] = nonEmptyValues.join(' ')
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
    
    .repeatable-mark {
      color: var(--primary-color);
      margin-left: var(--spacing-xs);
      font-size: var(--font-size-sm);
    }
    
    .repeatable-hint {
      color: var(--text-muted);
      font-style: italic;
    }
    
    .repeatable-input-container {
      .repeatable-input-row {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
        align-items: center;
        
        .repeatable-input {
          flex: 1;
        }
        
        .remove-value-btn {
          min-width: 32px;
          height: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      
      .add-value-btn {
        margin-top: var(--spacing-xs);
      }
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