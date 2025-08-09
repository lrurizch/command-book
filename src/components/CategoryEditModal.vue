<template>
  <div v-if="show" class="modal-overlay" @click="onCancel">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? '编辑分类' : '添加分类' }}</h3>
        <button class="close-btn" @click="onCancel">×</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">分类名称</label>
          <input
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="请输入分类名称"
            maxlength="20"
            @keyup.enter="onConfirm"
          >
        </div>
        

        
        <div v-if="!isEditing" class="form-group">
          <label class="form-label">父级分类</label>
          <select v-model="form.parentId" class="form-select">
            <option value="">根分类</option>
            <option
              v-for="category in availableParents"
              :key="category.id"
              :value="category.id"
            >
              {{ '  '.repeat(category.level) }}{{ category.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="onCancel">取消</button>
        <button
          class="btn btn-primary"
          :disabled="!form.name.trim()"
          @click="onConfirm"
        >
          {{ isEditing ? '保存' : '添加' }}
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
  show: {
    type: Boolean,
    required: true
  },
  category: Object, // 编辑时传入的分类对象
  parentCategory: Object // 添加子分类时传入的父分类
})

const emit = defineEmits(['update:show', 'confirm'])

const form = ref({
  name: '',
  parentId: ''
})

const isEditing = computed(() => !!props.category)

// 可选的父级分类（排除自己和自己的子分类）
const availableParents = computed(() => {
  if (isEditing.value) return []
  
  let categories = commandStore.categories.filter(cat => 
    cat.id !== 'all' && 
    cat.id !== 'recycle-bin'
  )
  
  if (props.parentCategory) {
    // 添加子分类时，限制最大层级为4
    const maxLevel = props.parentCategory.level + 1
    if (maxLevel >= 4) return []
    
    categories = categories.filter(cat => cat.level < 3)
  } else {
    categories = categories.filter(cat => cat.level < 3)
  }
  
  return categories
})

// 监听props变化，重置表单
watch(() => props.show, (show) => {
  if (show) {
    resetForm()
  }
})

const resetForm = () => {
  if (isEditing.value && props.category) {
    // 编辑模式
    form.value = {
      name: props.category.name,
      parentId: props.category.parentId || ''
    }
  } else {
    // 添加模式
    form.value = {
      name: '',
      parentId: props.parentCategory?.id || ''
    }
  }
}

const onConfirm = () => {
  if (!form.value.name.trim()) return
  
  const categoryData = {
    name: form.value.name.trim(),
    color: '#999999', // 使用默认颜色
    parentId: form.value.parentId || null,
    level: form.value.parentId ? 
      (commandStore.categories.find(cat => cat.id === form.value.parentId)?.level || 0) + 1 : 0
  }
  
  emit('confirm', {
    isEditing: isEditing.value,
    categoryId: props.category?.id,
    categoryData
  })
}

const onCancel = () => {
  emit('update:show', false)
}
</script>

<style lang="scss" scoped>
// Element Plus 模态框样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--el-overlay-color-lighter, rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--el-index-popper);
  backdrop-filter: blur(1px);
}

.modal-content {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--el-box-shadow-dark);
  border: 1px solid var(--el-border-color-lighter);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--el-spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
  
  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: var(--el-font-size-large);
    font-weight: var(--el-font-weight-primary);
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-border-radius-base);
  transition: var(--el-transition-all);
  
  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }
}

.modal-body {
  padding: var(--el-spacing-lg);
}

// Element Plus 表单样式
.form-group {
  margin-bottom: var(--el-spacing-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--el-spacing-sm);
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
  line-height: 1.5;
}

.form-input, .form-select {
  width: 100%;
  padding: 8px 11px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
  transition: var(--el-transition-all);
  outline: none;
  
  &:focus {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }
  
  &:hover {
    border-color: var(--el-border-color-hover, #c0c4cc);
  }
}



.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--el-spacing-sm);
  padding: var(--el-spacing-lg);
  border-top: 1px solid var(--el-border-color-lighter);
}

// 按钮样式继承全局 Element Plus 样式
</style> 