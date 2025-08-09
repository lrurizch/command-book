<template>
  <div v-if="show" class="modal-overlay" @click="onCancel">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>删除分类</h3>
        <button class="close-btn" @click="onCancel">×</button>
      </div>
      
      <div class="modal-body">
        <div class="warning-icon">⚠️</div>
        <h4>确定要删除分类 "{{ category?.name }}" 吗？</h4>
        <div class="warning-content">
          <p v-if="childrenCount > 0">
            此操作将同时删除 <strong>{{ childrenCount }}</strong> 个子分类
          </p>
          <p v-if="commandCount > 0">
            该分类下的 <strong>{{ commandCount }}</strong> 个命令将被移到回收站
          </p>
          <p class="danger-text">此操作不可撤销！</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="onCancel">取消</button>
        <button class="btn btn-danger" @click="onConfirm">确定删除</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCommandStore } from '../stores/command'

const commandStore = useCommandStore()

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  category: Object
})

const emit = defineEmits(['update:show', 'confirm'])

// 计算要删除的子分类数量
const childrenCount = computed(() => {
  if (!props.category) return 0
  const categoryIds = commandStore.getCategoryWithChildren(props.category.id)
  return categoryIds.length - 1 // 减去自己
})

// 计算该分类下的命令数量
const commandCount = computed(() => {
  if (!props.category) return 0
  const categoryIds = commandStore.getCategoryWithChildren(props.category.id)
  return commandStore.commands.filter(cmd => categoryIds.includes(cmd.category)).length
})

const onConfirm = () => {
  emit('confirm', props.category.id)
}

const onCancel = () => {
  emit('update:show', false)
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
  max-width: 450px;
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
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

h4 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 18px;
}

.warning-content {
  text-align: left;
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #f59e0b;
  
  p {
    margin: 8px 0;
    color: var(--text-secondary);
    
    &.danger-text {
      color: #ef4444;
      font-weight: 500;
      margin-top: 12px;
    }
    
    strong {
      color: var(--text-primary);
    }
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
  
  &.btn-danger {
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  }
}
</style> 