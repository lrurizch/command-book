<template>
  <div class="workflow-editor">
    <!-- 顶部导航 -->
    <div class="editor-header">
      <div class="header-left">
        <button class="btn btn-secondary" @click="goBack">
          ← 返回
        </button>
        <h1 class="page-title">
          {{ isEditing ? '编辑工作流' : '新建工作流' }}
        </h1>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="executeWorkflow" :disabled="!canExecute">
          ▶️ 执行
        </button>
        <button class="btn btn-primary" @click="saveWorkflow" :disabled="!isFormValid">
          💾 保存 (Ctrl+S)
        </button>
      </div>
    </div>

    <!-- 编辑内容 -->
    <div class="editor-content">
      <div class="form-container">
        <!-- 基本信息 -->
        <div class="form-section card">
          <div class="card-header">
            <h3>基本信息</h3>
          </div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label for="workflow-name" class="form-label">
                  工作流名称 <span class="required">*</span>
                </label>
                <input
                  id="workflow-name"
                  v-model="form.name"
                  type="text"
                  class="form-input input"
                  placeholder="输入工作流名称"
                  required
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="workflow-description" class="form-label">描述</label>
              <textarea
                id="workflow-description"
                v-model="form.description"
                class="form-textarea textarea"
                placeholder="描述工作流的用途"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="workflow-tags" class="form-label">标签 (用逗号分隔)</label>
              <input
                id="workflow-tags"
                v-model="tagsInput"
                type="text"
                class="form-input input"
                placeholder="例如: deployment, git, build"
                @blur="updateTags"
              >
              
              <div v-if="form.tags.length > 0" class="current-tags">
                <span
                  v-for="(tag, index) in form.tags"
                  :key="index"
                  class="tag tag-primary"
                >
                  {{ tag }}
                  <button type="button" class="tag-remove" @click="removeTag(index)">
                    ✕
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 工作流步骤 -->
        <div class="form-section card">
          <div class="card-header">
            <h3>工作流步骤</h3>
            <button class="btn btn-sm btn-primary" @click="addStep">
              + 添加步骤
            </button>
          </div>
          <div class="card-body">
            <div v-if="form.steps.length === 0" class="empty-steps">
              <div class="empty-icon">📋</div>
              <div class="empty-text">还没有添加步骤</div>
              <button class="btn btn-primary" @click="addStep">
                添加第一个步骤
              </button>
            </div>
            
            <div v-else class="steps-list">
              <div
                v-for="(step, index) in form.steps"
                :key="step.id || index"
                class="step-item card"
              >
                <div class="step-header">
                  <div class="step-number">{{ index + 1 }}</div>
                  <input
                    v-model="step.name"
                    type="text"
                    class="step-name-input input"
                    placeholder="步骤名称"
                  >
                  <div class="step-actions">
                    <button
                      class="btn btn-sm btn-secondary"
                      @click="moveStep(index, 'up')"
                      :disabled="index === 0"
                    >
                      ↑
                    </button>
                    <button
                      class="btn btn-sm btn-secondary"
                      @click="moveStep(index, 'down')"
                      :disabled="index === form.steps.length - 1"
                    >
                      ↓
                    </button>
                    <button
                      class="btn btn-sm btn-danger"
                      @click="removeStep(index)"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div class="step-body">
                  <div class="form-group">
                    <label class="form-label">步骤类型</label>
                    <select v-model="step.type" class="form-select input">
                      <option value="command">执行命令</option>
                      <option value="delay">延迟等待</option>
                      <option value="condition">条件判断</option>
                    </select>
                  </div>
                  
                  <!-- 命令步骤 -->
                  <div v-if="step.type === 'command'" class="command-step">
                    <div class="form-group">
                      <label class="form-label">选择命令</label>
                      <select v-model="step.commandId" class="form-select input">
                        <option value="">选择一个命令</option>
                        <option
                          v-for="command in commandStore.commands"
                          :key="command.id"
                          :value="command.id"
                        >
                          {{ command.name }}
                        </option>
                      </select>
                    </div>
                    
                    <div v-if="getSelectedCommand(step.commandId)" class="selected-command">
                      <div class="command-preview">
                        <strong>{{ getSelectedCommand(step.commandId).name }}</strong>
                        <code>{{ getSelectedCommand(step.commandId).command }}</code>
                      </div>
                      
                      <!-- 参数设置 -->
                      <div
                        v-if="getSelectedCommand(step.commandId).parameters?.length > 0"
                        class="step-parameters"
                      >
                        <label class="form-label">参数设置</label>
                        <div
                          v-for="param in getSelectedCommand(step.commandId).parameters"
                          :key="param.name"
                          class="parameter-setting"
                        >
                          <label class="param-label">{{ param.name }}</label>
                          <input
                            v-model="step.parameters[param.name]"
                            type="text"
                            class="form-input input"
                            :placeholder="param.defaultValue || `输入${param.name}`"
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 延迟步骤 -->
                  <div v-if="step.type === 'delay'" class="delay-step">
                    <div class="form-group">
                      <label class="form-label">延迟时间 (毫秒)</label>
                      <input
                        v-model.number="step.delay"
                        type="number"
                        class="form-input input"
                        placeholder="1000"
                        min="100"
                        step="100"
                      >
                    </div>
                  </div>
                  
                  <!-- 条件步骤 -->
                  <div v-if="step.type === 'condition'" class="condition-step">
                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">变量名</label>
                        <input
                          v-model="step.condition.variable"
                          type="text"
                          class="form-input input"
                          placeholder="变量名"
                        >
                      </div>
                      <div class="form-group">
                        <label class="form-label">条件</label>
                        <select v-model="step.condition.type" class="form-select input">
                          <option value="equals">等于</option>
                          <option value="not_equals">不等于</option>
                          <option value="contains">包含</option>
                          <option value="exists">存在</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="form-label">值</label>
                        <input
                          v-model="step.condition.value"
                          type="text"
                          class="form-input input"
                          placeholder="比较值"
                        >
                      </div>
                    </div>
                  </div>
                  
                  <!-- 通用设置 -->
                  <div class="step-settings">
                    <label class="checkbox-label">
                      <input
                        v-model="step.continueOnError"
                        type="checkbox"
                        class="form-checkbox"
                      >
                      出错时继续执行
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 执行历史 -->
    <ExecutionHistory
      v-if="isEditing && workflowStore.getExecutionHistory(route.params.id).length > 0"
      :workflow-id="route.params.id"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCommandStore } from '../stores/command'
import { useWorkflowStore } from '../stores/workflow'
import ExecutionHistory from '../components/ExecutionHistory.vue'

const router = useRouter()
const route = useRoute()
const commandStore = useCommandStore()
const workflowStore = useWorkflowStore()

// 响应式数据
const form = ref({
  name: '',
  description: '',
  tags: [],
  steps: []
})

const tagsInput = ref('')

// 计算属性
const isEditing = computed(() => !!route.params.id)

const isFormValid = computed(() => {
  return form.value.name.trim() && form.value.steps.length > 0
})

const canExecute = computed(() => {
  return form.value.steps.length > 0 && form.value.steps.every(step => {
    if (step.type === 'command') {
      return step.commandId
    }
    return true
  })
})

// 方法
const loadWorkflow = () => {
  if (isEditing.value) {
    const workflow = workflowStore.getWorkflow(route.params.id)
    if (workflow) {
      form.value = {
        name: workflow.name,
        description: workflow.description,
        tags: [...workflow.tags],
        steps: workflow.steps.map(step => ({
          ...step,
          parameters: step.parameters || {},
          condition: step.condition || { variable: '', type: 'equals', value: '' }
        }))
      }
      tagsInput.value = workflow.tags.join(', ')
    } else {
      router.push('/')
    }
  }
}

const addStep = () => {
  form.value.steps.push({
    id: generateId(),
    name: `步骤 ${form.value.steps.length + 1}`,
    type: 'command',
    commandId: '',
    parameters: {},
    condition: { variable: '', type: 'equals', value: '' },
    delay: 1000,
    continueOnError: false
  })
}

const removeStep = (index) => {
  form.value.steps.splice(index, 1)
}

const moveStep = (index, direction) => {
  const steps = form.value.steps
  const newIndex = direction === 'up' ? index - 1 : index + 1
  
  if (newIndex >= 0 && newIndex < steps.length) {
    const step = steps.splice(index, 1)[0]
    steps.splice(newIndex, 0, step)
  }
}

const getSelectedCommand = (commandId) => {
  return commandStore.getCommand(commandId)
}

const updateTags = () => {
  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
  
  form.value.tags = tags
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
  tagsInput.value = form.value.tags.join(', ')
}

const saveWorkflow = () => {
  if (!isFormValid.value) return

  updateTags()

  const workflowData = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    tags: form.value.tags,
    steps: form.value.steps.map(step => ({
      ...step,
      name: step.name.trim() || `步骤 ${form.value.steps.indexOf(step) + 1}`
    }))
  }

  if (isEditing.value) {
    workflowStore.updateWorkflow(route.params.id, workflowData)
    if (window.utoolsSystem) {
      window.utoolsSystem.showNotification('工作流已更新')
    }
  } else {
    workflowStore.addWorkflow(workflowData)
    if (window.utoolsSystem) {
      window.utoolsSystem.showNotification('工作流已创建')
    }
  }

  router.push('/')
}

const executeWorkflow = async () => {
  if (!canExecute.value) return

  // 先保存当前工作流
  if (isFormValid.value) {
    let workflowId = route.params.id
    
    if (!isEditing.value) {
      // 新工作流需要先保存
      const workflow = workflowStore.addWorkflow({
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        tags: form.value.tags,
        steps: form.value.steps
      })
      workflowId = workflow.id
    } else {
      // 更新现有工作流
      workflowStore.updateWorkflow(workflowId, {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        tags: form.value.tags,
        steps: form.value.steps
      })
    }

    // 执行工作流
    const result = await workflowStore.executeWorkflow(workflowId)
    
    if (result.status === 'completed') {
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification('工作流执行完成')
      }
    } else {
      if (window.utoolsSystem) {
        window.utoolsSystem.showNotification(`工作流执行失败: ${result.error}`)
      }
    }
  }
}

const goBack = () => {
  router.push('/')
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 键盘快捷键
const handleKeydown = (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        saveWorkflow()
        break
    }
  }
}

// 生命周期
onMounted(() => {
  loadWorkflow()
  document.addEventListener('keydown', handleKeydown)
  
  nextTick(() => {
    const firstInput = document.querySelector('#workflow-name')
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
.workflow-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-light);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    
    .page-title {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 600;
    }
  }
  
  .header-right {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.form-container {
  max-width: 1000px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: var(--spacing-lg);
  
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

.form-row {
  display: flex;
  gap: var(--spacing-md);
  
  .form-group {
    flex: 1;
  }
}

.form-group {
  margin-bottom: var(--spacing-md);
  
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
  
  .form-input,
  .form-select,
  .form-textarea {
    width: 100%;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-weight: normal;
    cursor: pointer;
    
    .form-checkbox {
      width: auto;
    }
  }
}

.current-tags {
  margin-top: var(--spacing-sm);
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  
  .tag {
    position: relative;
    padding-right: 20px;
    
    .tag-remove {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 10px;
    }
  }
}

.empty-steps {
  text-align: center;
  padding: var(--spacing-xl);
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--spacing-md);
  }
  
  .empty-text {
    font-size: var(--font-size-lg);
    color: var(--text-muted);
    margin-bottom: var(--spacing-md);
  }
}

.steps-list {
  .step-item {
    margin-bottom: var(--spacing-md);
    
    .step-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
      
      .step-number {
        width: 32px;
        height: 32px;
        background: var(--primary-color);
        color: var(--text-light);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
      }
      
      .step-name-input {
        flex: 1;
        font-weight: 600;
      }
      
      .step-actions {
        display: flex;
        gap: var(--spacing-xs);
      }
    }
    
    .step-body {
      padding-left: 40px;
    }
  }
}

.selected-command {
  margin-top: var(--spacing-md);
  
  .command-preview {
    padding: var(--spacing-sm);
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-md);
    
    strong {
      display: block;
      margin-bottom: var(--spacing-xs);
    }
    
    code {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: var(--font-size-sm);
      background: var(--bg-dark);
      color: var(--text-light);
      padding: var(--spacing-xs);
      border-radius: 3px;
    }
  }
}

.step-parameters {
  .parameter-setting {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    
    .param-label {
      min-width: 80px;
      font-size: var(--font-size-sm);
      font-weight: 600;
    }
    
    .form-input {
      flex: 1;
    }
  }
}

.step-settings {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
    
    .header-left,
    .header-right {
      justify-content: center;
    }
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .step-header {
    flex-wrap: wrap;
    
    .step-actions {
      order: 3;
      width: 100%;
      justify-content: center;
      margin-top: var(--spacing-sm);
    }
  }
  
  .step-body {
    padding-left: 0;
  }
  
  .parameter-setting {
    flex-direction: column;
    align-items: stretch;
    
    .param-label {
      min-width: auto;
    }
  }
}
</style> 