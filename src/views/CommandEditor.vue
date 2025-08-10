<template>
  <div class="command-editor">
    <!-- 顶部导航 -->
    <div class="editor-header">
      <div class="header-left">
        <button class="btn btn-secondary" @click="goBack">
          ← 返回
        </button>
        <h1 class="page-title">
          {{ isEditing ? '编辑命令模板' : '新建命令模板' }}
        </h1>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="previewCommand" :disabled="!form.command">
          👁️ 预览
        </button>
        <button class="btn btn-primary" @click="saveCommand" :disabled="!isFormValid">
          💾 保存 (Ctrl+S)
        </button>
      </div>
    </div>

    <!-- 编辑表单 -->
    <div class="editor-content">
      <div class="form-container">
        <form @submit.prevent="saveCommand" class="command-form">
          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">基本信息</h3>
            
            <div class="form-group">
              <label for="command-content" class="form-label">
                命令内容 <span class="required">*</span>
              </label>
              <textarea
                id="command-content"
                v-model="form.command"
                class="form-textarea textarea command-textarea"
                placeholder="输入命令，使用 {{参数名}} 表示参数占位符"
                rows="4"
                required
                @input="analyzeCommand"
              ></textarea>
              <div class="command-help">
                <div class="help-item">
                  💡 提示: 使用 <code>{{参数名}}</code> 创建参数占位符
                </div>
                <div class="help-item">
                  📝 示例: <code>git commit -m "{{message}}"</code>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="command-description" class="form-label">作用</label>
              <textarea
                id="command-description"
                v-model="form.description"
                class="form-textarea textarea"
                placeholder="描述这个命令的作用和用途"
                rows="2"
                maxlength="200"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="command-usage" class="form-label">使用说明</label>
              <textarea
                id="command-usage"
                v-model="form.usage"
                class="form-textarea textarea"
                placeholder="详细的使用说明和注意事项"
                rows="3"
                maxlength="500"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="command-category" class="form-label">分类</label>
                <select id="command-category" v-model="form.category" class="form-select input">
                  <option value="">全部</option>
                  <option
                    v-for="category in commandStore.categories.filter(c => c.id !== 'all')"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="command-tags" class="form-label">标签 (用逗号分隔)</label>
                <input
                  id="command-tags"
                  v-model="tagsInput"
                  type="text"
                  class="form-input input"
                  placeholder="例如: git, version, status"
                  @blur="updateTags"
                >
              </div>
            </div>
          </div>



          <!-- 参数设置 -->
          <div v-if="detectedParameters.length > 0 || form.parameters.length > 0" class="form-section">
            <h3 class="section-title">参数设置</h3>
            
            <div v-if="detectedParameters.length > 0" class="detected-params">
              <div class="detected-params-header">
                <span>检测到的参数:</span>
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  @click="addAllDetectedParams"
                >
                  全部添加
                </button>
              </div>
              <div class="detected-params-list">
                <span
                  v-for="param in detectedParameters"
                  :key="param"
                  class="tag tag-primary detected-param"
                  @click="addParameter(param)"
                >
                  + {{ param }}
                </span>
              </div>
            </div>
            
            <div class="parameters-list">
              <div
                v-for="(param, index) in form.parameters"
                :key="index"
                class="parameter-item card"
              >
                <div class="parameter-header">
                  <input
                    v-model="param.name"
                    type="text"
                    class="param-name-input input"
                    placeholder="参数名"
                    required
                  >
                  <button
                    type="button"
                    class="btn btn-sm btn-danger"
                    @click="removeParameter(index)"
                  >
                    🗑️
                  </button>
                </div>
                
                <div class="parameter-body">
                  <div class="form-group">
                    <label class="form-label">描述</label>
                    <input
                      v-model="param.description"
                      type="text"
                      class="form-input input"
                      placeholder="参数描述"
                    >
                  </div>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">默认值</label>
                      <input
                        v-model="param.defaultValue"
                        type="text"
                        class="form-input input"
                        placeholder="默认值（可选）"
                      >
                    </div>
                    
                    <div class="form-group">
                      <label class="checkbox-label">
                        <input
                          v-model="param.required"
                          type="checkbox"
                          class="form-checkbox"
                        >
                        必填参数
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                class="btn btn-secondary add-param-btn"
                @click="addCustomParameter"
              >
                + 添加参数
              </button>
            </div>
          </div>


        </form>
      </div>

      <!-- 预览区域 -->
      <div v-if="showPreview" class="preview-container">
        <div class="preview-header">
          <h3>预览</h3>
          <button class="btn btn-sm btn-secondary" @click="showPreview = false">
            ✕
          </button>
        </div>
        
        <CommandCard
          :command="previewData"
          :show-stats="false"
          @copy="onPreviewCopy"
          @execute="onPreviewExecute"
        />
      </div>
    </div>

    <!-- 参数输入模态框 -->
    <ParameterModal
      v-if="showParameterModal"
      :command="previewData"
      @confirm="onParameterConfirm"
      @cancel="showParameterModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCommandStore } from '../stores/command'
import CommandCard from '../components/CommandCard.vue'
import ParameterModal from '../components/ParameterModal.vue'
import { showSaveSuccess } from '../utils/toast'

const router = useRouter()
const route = useRoute()
const commandStore = useCommandStore()

// 响应式数据
const form = ref({
  command: '',
  description: '',
  usage: '',
  category: '',
  tags: [],
  parameters: []
})

const tagsInput = ref('')
const detectedParameters = ref([])
const showPreview = ref(false)
const showParameterModal = ref(false)

// 计算属性
const isEditing = computed(() => !!route.params.id)

const isFormValid = computed(() => {
  return form.value.command.trim()
})

const suggestedTags = computed(() => {
  const allTags = commandStore.allTags
  const currentTags = form.value.tags
  return allTags.filter(tag => !currentTags.includes(tag)).slice(0, 10)
})

const previewData = computed(() => ({
  id: 'preview',
  name: generateCommandName(form.value.command),
  description: form.value.description || '暂无描述',
  usage: form.value.usage || '暂无使用说明',
  command: form.value.command,
  category: form.value.category,
  tags: form.value.tags,
  parameters: form.value.parameters
}))

// 方法
const loadCommand = () => {
  if (isEditing.value) {
    const command = commandStore.getCommand(route.params.id)
    if (command) {
      form.value = {
        command: command.command,
        description: command.description,
        usage: command.usage || '',
        category: command.category,
        tags: [...command.tags],
        parameters: command.parameters ? [...command.parameters] : []
      }
      tagsInput.value = command.tags.join(', ')
      analyzeCommand()
    } else {
      // 命令不存在，返回首页
      router.push('/')
    }
  }
}

const analyzeCommand = () => {
  const command = form.value.command
  const regex = /\{\{([^}]+)\}\}/g
  const params = []
  let match

  while ((match = regex.exec(command)) !== null) {
    const paramName = match[1].trim()
    if (paramName && !params.includes(paramName)) {
      params.push(paramName)
    }
  }

  // 过滤掉已存在的参数
  const existingParamNames = form.value.parameters.map(p => p.name)
  detectedParameters.value = params.filter(param => !existingParamNames.includes(param))
}

const addParameter = (paramName) => {
  if (!form.value.parameters.find(p => p.name === paramName)) {
    form.value.parameters.push({
      name: paramName,
      description: '',
      required: false,
      defaultValue: ''
    })
  }
  
  // 从检测到的参数中移除
  const index = detectedParameters.value.indexOf(paramName)
  if (index > -1) {
    detectedParameters.value.splice(index, 1)
  }
}

const addAllDetectedParams = () => {
  detectedParameters.value.forEach(param => {
    addParameter(param)
  })
}

const addCustomParameter = () => {
  form.value.parameters.push({
    name: '',
    description: '',
    required: false,
    defaultValue: ''
  })
}

const removeParameter = (index) => {
  form.value.parameters.splice(index, 1)
  analyzeCommand() // 重新分析以更新检测到的参数
}

const updateTags = () => {
  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag)
    .filter((tag, index, arr) => arr.indexOf(tag) === index) // 去重
  
  form.value.tags = tags
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
  tagsInput.value = form.value.tags.join(', ')
}

const addSuggestedTag = (tag) => {
  if (!form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagsInput.value = form.value.tags.join(', ')
  }
}

// 自动生成命令名称
const generateCommandName = (command) => {
  if (!command.trim()) return '新建命令模板'
  
  // 提取命令的主要部分作为名称
  const parts = command.trim().split(' ')
  if (parts.length === 0) return '新建命令模板'
  
  // 处理常见命令格式
  const mainCommand = parts[0]
  const subCommand = parts[1]
  
  // 常见命令映射
  const commandMap = {
    'git': {
      'status': 'Git 状态查看',
      'add': 'Git 添加文件',
      'commit': 'Git 提交',
      'push': 'Git 推送',
      'pull': 'Git 拉取',
      'checkout': 'Git 切换分支',
      'branch': 'Git 分支操作',
      'clone': 'Git 克隆仓库',
      'init': 'Git 初始化'
    },
    'docker': {
      'ps': 'Docker 容器列表',
      'run': 'Docker 运行容器',
      'stop': 'Docker 停止容器',
      'start': 'Docker 启动容器',
      'build': 'Docker 构建镜像',
      'pull': 'Docker 拉取镜像',
      'push': 'Docker 推送镜像'
    },
    'npm': {
      'install': 'NPM 安装包',
      'run': 'NPM 运行脚本',
      'start': 'NPM 启动项目',
      'build': 'NPM 构建项目',
      'test': 'NPM 运行测试'
    }
  }
  
  if (commandMap[mainCommand] && commandMap[mainCommand][subCommand]) {
    return commandMap[mainCommand][subCommand]
  }
  
  // 如果没有匹配，使用首字母大写的命令名
  if (subCommand) {
    return `${mainCommand.charAt(0).toUpperCase() + mainCommand.slice(1)} ${subCommand}`
  } else {
    return mainCommand.charAt(0).toUpperCase() + mainCommand.slice(1) + ' 命令'
  }
}

const previewCommand = () => {
  showPreview.value = !showPreview.value
}

const onPreviewCopy = (command) => {
  commandStore.executeCommand(command.command)
}

const onPreviewExecute = (command) => {
  if (command.parameters && command.parameters.length > 0) {
    showParameterModal.value = true
  } else {
    onPreviewCopy(command)
  }
}

const onParameterConfirm = (parameters) => {
  commandStore.executeCommand(previewData.value.command, parameters)
  showParameterModal.value = false
}

const saveCommand = () => {
  if (!isFormValid.value) return

  updateTags() // 确保标签是最新的

  const commandData = {
    name: generateCommandName(form.value.command.trim()),
    description: form.value.description.trim(),
    usage: form.value.usage.trim(),
    command: form.value.command.trim(),
    category: form.value.category,
    tags: form.value.tags,
    parameters: form.value.parameters.filter(p => p.name.trim()) // 过滤空参数
  }

  if (isEditing.value) {
    commandStore.updateCommand(route.params.id, commandData)
    showSaveSuccess(commandData.name, true)
  } else {
    commandStore.addCommand(commandData)
    showSaveSuccess(commandData.name, false)
  }

  router.push('/')
}

const goBack = () => {
  router.push('/')
}

// 键盘快捷键
const handleKeydown = (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        saveCommand()
        break
    }
  }
}

// 监听命令内容变化
watch(() => form.value.command, () => {
  analyzeCommand()
})

// 生命周期
onMounted(() => {
  loadCommand()
  document.addEventListener('keydown', handleKeydown)
  
  // 聚焦第一个输入框
  nextTick(() => {
    const firstInput = document.querySelector('#command-content')
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
// Element Plus 命令编辑器样式
.command-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--el-spacing-md);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-md);
    
    .page-title {
      margin: 0;
      font-size: var(--el-font-size-extra-large);
      font-weight: var(--el-font-weight-primary);
      color: var(--el-text-color-primary);
    }
  }
  
  .header-right {
    display: flex;
    gap: var(--el-spacing-sm);
  }
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.form-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.command-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: var(--spacing-xl);
  
  .section-title {
    margin: 0 0 var(--spacing-md) 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    border-bottom: 2px solid var(--primary-color);
    padding-bottom: var(--spacing-xs);
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

.command-input-container {
  .command-textarea {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: var(--font-size-sm);
  }
  
  .command-help {
    margin-top: var(--spacing-sm);
    padding: var(--spacing-sm);
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    
    .help-item {
      font-size: var(--font-size-xs);
      color: var(--text-muted);
      margin-bottom: var(--spacing-xs);
      
      &:last-child {
        margin-bottom: 0;
      }
      
      code {
        background: var(--bg-primary);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }
    }
  }
}

.detected-params {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  
  .detected-params-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-size-sm);
    font-weight: 600;
  }
  
  .detected-params-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    
    .detected-param {
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: var(--primary-color);
        color: var(--text-light);
        transform: scale(1.05);
      }
    }
  }
}

.parameters-list {
  .parameter-item {
    margin-bottom: var(--spacing-md);
    
    .parameter-header {
      display: flex;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      
      .param-name-input {
        flex: 1;
        font-weight: 600;
      }
    }
    
    .parameter-body {
      padding-left: var(--spacing-md);
    }
  }
  
  .add-param-btn {
    width: 100%;
    padding: var(--spacing-md);
    border: 2px dashed var(--border-color);
    background: transparent;
    
    &:hover {
      border-color: var(--primary-color);
      background: rgba(0, 122, 204, 0.05);
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
      
      &:hover {
        color: var(--danger-color);
      }
    }
  }
}

.suggested-tags {
  margin-top: var(--spacing-sm);
  
  .suggested-tags-header {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-bottom: var(--spacing-xs);
  }
  
  .suggested-tag {
    cursor: pointer;
    transition: all 0.2s ease;
    margin-right: var(--spacing-xs);
    margin-bottom: var(--spacing-xs);
    
    &:hover {
      background-color: var(--primary-color);
      color: var(--text-light);
    }
  }
}

.preview-container {
  width: 400px;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    
    h3 {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: 600;
    }
  }
  
  :deep(.command-card) {
    margin: var(--spacing-md);
    flex: 1;
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .editor-content {
    flex-direction: column;
  }
  
  .preview-container {
    width: 100%;
    max-height: 400px;
    border-left: none;
    border-top: 1px solid var(--border-color);
  }
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
  
  .command-form {
    max-width: none;
  }
}
</style> 