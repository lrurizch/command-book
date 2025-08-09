<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal category-modal card">
      <div class="modal-header card-header">
        <h3 class="modal-title">
          {{ category ? '编辑分类' : '新建分类' }}
        </h3>
        <button class="modal-close btn btn-sm btn-secondary" @click="$emit('cancel')">
          ✕
        </button>
      </div>
      
      <div class="modal-body card-body">
        <form @submit.prevent="handleSubmit" class="category-form">
          <div class="form-group">
            <label for="category-name" class="form-label">
              分类名称 <span class="required">*</span>
            </label>
            <input
              id="category-name"
              v-model="form.name"
              type="text"
              class="form-input input"
              placeholder="输入分类名称"
              required
              maxlength="50"
            >
          </div>
          
          <div class="form-group">
            <label for="category-color" class="form-label">分类颜色</label>
            <div class="color-picker-container">
              <input
                id="category-color"
                v-model="form.color"
                type="color"
                class="color-picker"
              >
              <input
                v-model="form.color"
                type="text"
                class="color-input input"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
              >
            </div>
            
            <div class="color-presets">
              <div class="presets-label">预设颜色:</div>
              <div class="presets-grid">
                <button
                  v-for="color in colorPresets"
                  :key="color"
                  type="button"
                  class="preset-color"
                  :style="{ backgroundColor: color }"
                  @click="form.color = color"
                  :title="color"
                ></button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">预览</label>
            <div class="category-preview">
              <div
                class="preview-dot"
                :style="{ backgroundColor: form.color }"
              ></div>
              <span class="preview-name">{{ form.name || '分类名称' }}</span>
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
            {{ category ? '更新' : '创建' }} (Enter)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  category: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['confirm', 'cancel'])

// 响应式数据
const form = ref({
  name: '',
  color: '#007acc'
})

// 预设颜色
const colorPresets = [
  '#007acc', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
  '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d',
  '#f14e32', '#2496ed', '#cb3837', '#336791', '#ff6b35'
]

// 计算属性
const isFormValid = computed(() => {
  return form.value.name.trim() && /^#[0-9A-Fa-f]{6}$/.test(form.value.color)
})

// 方法
const initializeForm = () => {
  if (props.category) {
    form.value = {
      name: props.category.name,
      color: props.category.color
    }
  } else {
    form.value = {
      name: '',
      color: colorPresets[0]
    }
  }
}

const handleSubmit = () => {
  if (isFormValid.value) {
    emit('confirm', {
      name: form.value.name.trim(),
      color: form.value.color
    })
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
  initializeForm()
  document.addEventListener('keydown', handleKeydown)
  
  // 聚焦第一个输入框
  nextTick(() => {
    const firstInput = document.querySelector('#category-name')
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

.category-modal {
  width: 90%;
  max-width: 500px;
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

.category-form {
  .form-group {
    margin-bottom: var(--spacing-lg);
    
    .form-label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: 600;
      margin-bottom: var(--spacing-sm);
      color: var(--text-primary);
      
      .required {
        color: var(--danger-color);
      }
    }
    
    .form-input {
      width: 100%;
    }
  }
}

.color-picker-container {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  
  .color-picker {
    width: 60px;
    height: 40px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    
    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    
    &::-webkit-color-swatch {
      border: none;
      border-radius: calc(var(--border-radius) - 1px);
    }
  }
  
  .color-input {
    flex: 1;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    text-transform: uppercase;
  }
}

.color-presets {
  margin-top: var(--spacing-md);
  
  .presets-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
  }
  
  .presets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(32px, 1fr));
    gap: var(--spacing-xs);
    max-width: 300px;
    
    .preset-color {
      width: 32px;
      height: 32px;
      border: 2px solid var(--border-color);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        transform: scale(1.1);
        border-color: var(--primary-color);
      }
    }
  }
}

.category-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  
  .preview-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .preview-name {
    font-weight: 600;
    color: var(--text-primary);
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

@media (max-width: 768px) {
  .category-modal {
    width: 95%;
  }
  
  .modal-footer .footer-actions {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
  
  .color-picker-container {
    flex-direction: column;
    align-items: stretch;
    
    .color-picker {
      width: 100%;
    }
  }
}
</style> 