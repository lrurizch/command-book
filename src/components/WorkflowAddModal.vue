<template>
  <el-dialog
    v-model="visible"
    title="添加工作流"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入工作流名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="请输入工作流描述"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="分类" prop="category">
        <el-select
          v-model="form.category"
          placeholder="请选择分类"
          style="width: 100%"
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="步骤" prop="steps">
        <div class="workflow-steps">
          <div
            v-for="(step, index) in form.steps"
            :key="index"
            class="step-item"
          >
            <div class="step-header">
              <span class="step-number">{{ index + 1 }}</span>
              <el-input
                v-model="step.name"
                placeholder="步骤名称"
                style="flex: 1"
              />
              <el-button
                type="danger"
                size="small"
                @click="removeStep(index)"
                :disabled="form.steps.length <= 1"
              >
                删除
              </el-button>
            </div>
            
            <el-input
              v-model="step.command"
              type="textarea"
              placeholder="请输入命令"
              :rows="2"
              style="margin-top: 8px"
            />
            
            <el-input
              v-model="step.description"
              placeholder="步骤描述（可选）"
              style="margin-top: 8px"
            />
          </div>
          
          <el-button
            type="primary"
            @click="addStep"
            style="width: 100%"
          >
            + 添加步骤
          </el-button>
        </div>
      </el-form-item>
      
      <el-form-item label="标签">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          placeholder="请选择或输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommandStore } from '../stores/command'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'confirm'])

const commandStore = useCommandStore()
const formRef = ref(null)
const loading = ref(false)

const visible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 表单数据
const form = ref({
  name: '',
  description: '',
  category: '',
  steps: [
    {
      name: '',
      command: '',
      description: ''
    }
  ],
  tags: []
})

// 验证规则
const rules = {
  name: [
    { required: true, message: '请输入工作流名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度应在 1 到 100 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  steps: [
    { required: true, message: '至少需要一个步骤', trigger: 'blur' }
  ]
}

// 可用分类
const categories = computed(() => {
  return commandStore.categories.filter(cat => cat.id !== 'recycle-bin')
})

// 可用标签
const availableTags = computed(() => {
  const allTags = new Set()
  commandStore.commands.forEach(cmd => {
    if (cmd.tags) {
      cmd.tags.forEach(tag => allTags.add(tag))
    }
  })
  return Array.from(allTags)
})

// 添加步骤
const addStep = () => {
  form.value.steps.push({
    name: '',
    command: '',
    description: ''
  })
}

// 删除步骤
const removeStep = (index) => {
  if (form.value.steps.length > 1) {
    form.value.steps.splice(index, 1)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 过滤空步骤
    const validSteps = form.value.steps.filter(step => 
      step.name.trim() && step.command.trim()
    )
    
    if (validSteps.length === 0) {
      throw new Error('至少需要一个有效步骤')
    }
    
    const workflow = {
      id: Date.now().toString(),
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      category: form.value.category,
      steps: validSteps,
      tags: form.value.tags,
      type: 'workflow',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usage: 0
    }
    
    emit('confirm', workflow)
    resetForm()
  } catch (error) {
    console.error('提交工作流失败:', error)
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    category: '',
    steps: [
      {
        name: '',
        command: '',
        description: ''
      }
    ],
    tags: []
  }
  
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 监听显示状态
watch(() => props.show, (newVal) => {
  if (newVal) {
    // 设置默认分类
    if (categories.value.length > 0) {
      form.value.category = categories.value[0].id
    }
  }
})
</script>

<style lang="scss" scoped>
.workflow-steps {
  .step-item {
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    padding: var(--el-spacing-md);
    margin-bottom: var(--el-spacing-md);
    background: var(--el-fill-color-extra-light);
    
    .step-header {
      display: flex;
      align-items: center;
      gap: var(--el-spacing-sm);
      
      .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: var(--el-color-primary);
        color: white;
        border-radius: 50%;
        font-size: var(--el-font-size-small);
        font-weight: 600;
        flex-shrink: 0;
      }
    }
  }
}
</style> 