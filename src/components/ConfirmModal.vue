<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal confirm-modal card">
      <div class="modal-header card-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close btn btn-sm btn-secondary" @click="$emit('cancel')">
          ✕
        </button>
      </div>
      
      <div class="modal-body card-body">
        <div class="confirm-message">
          {{ message }}
        </div>
      </div>
      
      <div class="modal-footer card-footer">
        <div class="footer-actions">
          <button class="btn btn-secondary" @click="$emit('cancel')">
            取消 (Esc)
          </button>
          <button class="btn btn-danger" @click="$emit('confirm')">
            确认 (Enter)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

defineProps({
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

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
      event.preventDefault()
      emit('confirm')
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
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

.confirm-modal {
  width: 90%;
  max-width: 400px;
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

.confirm-message {
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--text-primary);
}

.modal-footer {
  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    
    .btn {
      min-width: 80px;
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
  .confirm-modal {
    width: 95%;
  }
  
  .modal-footer .footer-actions {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
}
</style> 