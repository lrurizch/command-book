<template>
  <el-dialog
    v-model="dialogVisible"
    title="命令构建器"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="command-builder">
      <!-- 选择区域 -->
      <div class="builder-header" v-if="!props.command">
        <div class="selector-group">
          <div class="category-selector">
            <label>选择分类：</label>
            <el-select 
              v-model="selectedCategory" 
              placeholder="选择命令分类"
              @change="handleCategoryChange"
              style="width: 200px"
            >
              <el-option
                v-for="category in availableCategories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </div>
          
          <div class="base-command-selector" v-if="availableBaseCommands.length > 0">
            <label>选择基础命令：</label>
            <el-select 
              v-model="selectedBaseCommand" 
              placeholder="选择基础命令"
              @change="handleBaseCommandChange"
              style="width: 300px"
            >
              <el-option
                v-for="cmd in availableBaseCommands"
                :key="cmd.id"
                :label="`${cmd.name} - ${cmd.description}`"
                :value="cmd.id"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- 基于现有命令的模板选择 -->
      <div class="template-header" v-if="props.command && selectedCommand">
        <h4>基于命令: {{ selectedCommand.name }}</h4>
        <div class="template-actions">
          <el-button @click="useBaseCommand" size="small" type="primary">
            使用基础命令
          </el-button>
          <el-button @click="useFullTemplate" size="small" type="success">
            使用完整模板
          </el-button>
        </div>
      </div>

      <!-- 命令构建区域 -->
      <div class="command-workspace" v-if="selectedCommand">
        <!-- 命令预览 -->
        <div class="command-preview">
          <div class="preview-header">
            <h4>
              <el-icon><Monitor /></el-icon>
              构建的命令
            </h4>
            <div class="preview-stats">
              <el-tag size="small" type="info">
                {{ commandParts.length }} 个部分
              </el-tag>
              <el-tag v-if="hasRequiredParams" size="small" type="warning">
                需要参数
              </el-tag>
            </div>
          </div>
          
          <el-input
            v-model="builtCommand"
            type="textarea"
            :rows="4"
            placeholder="构建的命令将在这里显示..."
            class="command-output"
            @input="parseAndSyncButtonStates"
          />
          
          <div class="command-actions">
            <el-button @click="clearCommand" size="small">
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
            <el-button @click="resetToBase" size="small" type="warning">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </div>
        </div>

        <!-- 构建工具栏 -->
        <div class="builder-sections">
          <!-- 常用命令 -->
          <div v-if="selectedCommand.commonCommands && selectedCommand.commonCommands.length > 0" class="builder-section">
            <h4>
              <el-icon><Star /></el-icon>
              常用命令
            </h4>
            <div class="command-buttons">
              <el-button
                v-for="cmd in selectedCommand.commonCommands"
                :key="cmd.name"
                @click="insertCommand(cmd.command)"
                size="small"
                type="primary"
                plain
              >
                {{ cmd.name }}
                <el-tooltip :content="cmd.description" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </el-button>
            </div>
          </div>

          <!-- 选项 -->
          <div v-if="selectedCommand.options && selectedCommand.options.length > 0" class="builder-section">
            <h4>
              <el-icon><Setting /></el-icon>
              选项
            </h4>
            <div class="option-buttons">
              <el-button
                v-for="option in selectedCommand.options"
                :key="option.flag"
                @click="toggleOption(option.flag)"
                size="small"
                :type="selectedOptions.has(option.flag) ? 'success' : 'default'"
                :class="{ 'is-active': selectedOptions.has(option.flag) }"
              >
                <code>{{ option.flag }}</code>
                <el-tooltip :content="option.description" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </el-button>
            </div>
          </div>

          <!-- 常用参数组合 -->
          <div v-if="selectedCommand.commonParameters && selectedCommand.commonParameters.length > 0" class="builder-section">
            <h4>
              <el-icon><Collection /></el-icon>
              常用参数组合
            </h4>
            <div class="parameter-buttons">
              <el-button
                v-for="params in selectedCommand.commonParameters"
                :key="params.name"
                @click="toggleParameter(params.params)"
                size="small"
                :type="selectedParameters.has(params.params) ? 'success' : 'default'"
                :class="{ 'is-active': selectedParameters.has(params.params) }"
              >
                {{ params.name }}
                <el-tooltip :content="params.description + ' → ' + params.params" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </el-button>
            </div>
          </div>

          <!-- 分隔符 -->
          <div v-if="selectedCommand.separators && selectedCommand.separators.length > 0" class="builder-section">
            <h4>
              <el-icon><Link /></el-icon>
              分隔符
            </h4>
            <div class="separator-buttons">
              <el-button
                v-for="separator in selectedCommand.separators"
                :key="separator.symbol"
                @click="toggleSeparator(separator.symbol)"
                size="small"
                :type="selectedSeparators.has(separator.symbol) ? 'success' : 'default'"
                :class="{ 'is-active': selectedSeparators.has(separator.symbol) }"
              >
                <code>{{ separator.symbol }}</code>
                <el-tooltip :content="separator.description + ' → ' + separator.example" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </el-button>
            </div>
          </div>

          <!-- 参数输入 -->
          <div v-if="selectedCommand.parameters && selectedCommand.parameters.length > 0" class="builder-section">
            <h4>
              <el-icon><Edit /></el-icon>
              参数输入
            </h4>
            <div class="parameter-inputs">
              <div 
                v-for="param in selectedCommand.parameters" 
                :key="param.name"
                class="parameter-input-group"
              >
                <label>
                  {{ param.description || param.name }}
                  <el-tag 
                    :type="param.required ? 'danger' : 'info'" 
                    size="small"
                  >
                    {{ param.required ? '必需' : '可选' }}
                  </el-tag>
                </label>
                <div class="input-with-actions">
                  <el-input
                    v-model="parameterValues[param.name]"
                    :placeholder="getParameterPlaceholder(param)"
                    @input="updateCommandWithParams"
                    clearable
                  />
                  <el-button 
                    @click="insertParameterPlaceholder(param.name)"
                    size="small"
                    type="primary"
                    text
                  >
                    插入占位符
                  </el-button>
                </div>
                <div v-if="param.defaultValue" class="param-help">
                  默认值: {{ param.defaultValue }}
                </div>
              </div>
            </div>
          </div>

          <!-- 手动追加 -->
          <div class="builder-section">
            <h4>
              <el-icon><EditPen /></el-icon>
              手动追加
            </h4>
            <div class="manual-input">
              <el-input
                v-model="manualInput"
                placeholder="输入要追加的内容..."
                @keyup.enter="appendManualInput"
              >
                <template #append>
                  <el-button @click="appendManualInput" type="primary">
                    追加
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <span v-if="selectedCommand">
            基于: {{ selectedCommand.name }}
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button @click="copyCommand" type="primary">
            <el-icon><CopyDocument /></el-icon>
            复制命令
          </el-button>
          <el-button @click="executeCommand" type="success">
            <el-icon><CaretRight /></el-icon>
            执行命令
          </el-button>
          <el-button @click="saveAsNewCommand" type="warning">
            <el-icon><DocumentAdd /></el-icon>
            保存为新命令
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCommandStore } from '../stores/command'
import { showCopySuccess, showExecuteSuccess, showSaveSuccess, toast } from '../utils/toast'

// Props和Emits
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  command: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'execute', 'save'])

// Store
const commandStore = useCommandStore()

// 响应式状态
const dialogVisible = ref(false)
const selectedCategory = ref('')
const selectedBaseCommand = ref('')
const selectedCommand = ref(null)
const builtCommand = ref('')
const parameterValues = ref({})
const manualInput = ref('')

// 选中状态
const selectedOptions = ref(new Set())
const selectedParameters = ref(new Set())
const selectedSeparators = ref(new Set())

// 计算属性
const availableCategories = computed(() => {
  return commandStore.categoryTree.filter(cat => 
    cat.id !== 'all' && cat.id !== 'recycle-bin' && cat.hasCommands
  )
})

const availableBaseCommands = computed(() => {
  if (!selectedCategory.value) return []
  return commandStore.filteredCommands.filter(cmd => 
    cmd.category === selectedCategory.value && !cmd.isDeleted
  )
})

const commandParts = computed(() => {
  if (!builtCommand.value) return []
  return builtCommand.value.trim().split(/\s+/).filter(part => part.length > 0)
})

const hasRequiredParams = computed(() => {
  if (!selectedCommand.value?.parameters) return false
  return selectedCommand.value.parameters.some(param => 
    param.required && !parameterValues.value[param.name]
  )
})

// 事件处理
const handleCategoryChange = () => {
  selectedBaseCommand.value = ''
  selectedCommand.value = null
  resetBuilder()
}

const handleBaseCommandChange = () => {
  const command = availableBaseCommands.value.find(cmd => cmd.id === selectedBaseCommand.value)
  if (command) {
    selectedCommand.value = command
    initializeFromCommand(command)
  }
}

const initializeFromCommand = (command) => {
  resetBuilder()
  
  // 设置基础命令
  builtCommand.value = command.commandName || command.name.split(' ')[0] || 'command'
  
  // 初始化默认参数值
  if (command.parameters) {
    command.parameters.forEach(param => {
      if (param.defaultValue) {
        parameterValues.value[param.name] = param.defaultValue
      }
    })
  }
  
  // 更新命令预览
  updateCommandWithParams()
}

const useBaseCommand = () => {
  if (!selectedCommand.value) return
  builtCommand.value = selectedCommand.value.commandName || selectedCommand.value.name.split(' ')[0] || 'command'
  resetSelections()
}

const useFullTemplate = () => {
  if (!selectedCommand.value) return
  builtCommand.value = selectedCommand.value.command || selectedCommand.value.commandName || 'command'
  resetSelections()
  parseAndSyncButtonStates()
}

const resetBuilder = () => {
  builtCommand.value = ''
  parameterValues.value = {}
  manualInput.value = ''
  resetSelections()
}

const resetSelections = () => {
  selectedOptions.value.clear()
  selectedParameters.value.clear()
  selectedSeparators.value.clear()
}

const clearCommand = () => {
  builtCommand.value = ''
  resetSelections()
}

const resetToBase = () => {
  if (selectedCommand.value) {
    initializeFromCommand(selectedCommand.value)
  }
}

// 按钮操作
const insertCommand = (command) => {
  addToCommand(command)
}

const toggleOption = (flag) => {
  if (selectedOptions.value.has(flag)) {
    selectedOptions.value.delete(flag)
    removeFromCommand(flag)
  } else {
    selectedOptions.value.add(flag)
    addToCommand(flag)
  }
}

const toggleParameter = (params) => {
  if (selectedParameters.value.has(params)) {
    selectedParameters.value.delete(params)
    removeFromCommand(params)
  } else {
    selectedParameters.value.add(params)
    addToCommand(params)
  }
}

const toggleSeparator = (separator) => {
  if (selectedSeparators.value.has(separator)) {
    selectedSeparators.value.delete(separator)
    removeFromCommand(separator)
  } else {
    selectedSeparators.value.add(separator)
    addToCommand(separator)
  }
}

const addToCommand = (part) => {
  if (!builtCommand.value.trim()) {
    builtCommand.value = part
  } else {
    builtCommand.value += ' ' + part
  }
}

const removeFromCommand = (part) => {
  const regex = new RegExp(`\\s*${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g')
  builtCommand.value = builtCommand.value.replace(regex, ' ').replace(/\s+/g, ' ').trim()
}

const parseAndSyncButtonStates = () => {
  // 根据当前命令内容同步按钮状态
  const command = builtCommand.value
  
  // 同步选项状态
  if (selectedCommand.value?.options) {
    selectedCommand.value.options.forEach(option => {
      if (command.includes(option.flag)) {
        selectedOptions.value.add(option.flag)
      } else {
        selectedOptions.value.delete(option.flag)
      }
    })
  }
  
  // 同步参数状态
  if (selectedCommand.value?.commonParameters) {
    selectedCommand.value.commonParameters.forEach(params => {
      if (command.includes(params.params)) {
        selectedParameters.value.add(params.params)
      } else {
        selectedParameters.value.delete(params.params)
      }
    })
  }
  
  // 同步分隔符状态
  if (selectedCommand.value?.separators) {
    selectedCommand.value.separators.forEach(separator => {
      if (command.includes(separator.symbol)) {
        selectedSeparators.value.add(separator.symbol)
      } else {
        selectedSeparators.value.delete(separator.symbol)
      }
    })
  }
}

// 参数处理
const getParameterPlaceholder = (param) => {
  if (param.placeholder) return param.placeholder
  if (param.defaultValue) return `默认: ${param.defaultValue}`
  return `输入${param.description || param.name}`
}

const insertParameterPlaceholder = (paramName) => {
  const placeholder = `{{${paramName}}}`
  addToCommand(placeholder)
}

const updateCommandWithParams = () => {
  if (!selectedCommand.value?.parameters) return
  
  let command = builtCommand.value
  
  // 替换参数占位符
  selectedCommand.value.parameters.forEach(param => {
    const placeholder = `{{${param.name}}}`
    const value = parameterValues.value[param.name]
    
    if (value && command.includes(placeholder)) {
      command = command.replace(new RegExp(placeholder, 'g'), value)
    }
  })
  
  builtCommand.value = command
}

const appendManualInput = () => {
  if (manualInput.value.trim()) {
    addToCommand(manualInput.value.trim())
    manualInput.value = ''
  }
}

// 最终操作
const copyCommand = () => {
  if (!builtCommand.value.trim()) {
    toast.warning('没有可复制的命令')
    return
  }
  
  navigator.clipboard.writeText(builtCommand.value.trim()).then(() => {
    showCopySuccess()
    if (selectedCommand.value) {
      commandStore.updateCommandStats(selectedCommand.value.id)
    }
  }).catch(err => {
    toast.error('复制失败: ' + err.message)
  })
}

const executeCommand = () => {
  if (!builtCommand.value.trim()) {
    toast.warning('没有可执行的命令')
    return
  }
  
  emit('execute', {
    command: builtCommand.value.trim(),
    original: selectedCommand.value
  })
  
  if (selectedCommand.value) {
    commandStore.updateCommandStats(selectedCommand.value.id)
  }
  showExecuteSuccess()
  handleClose()
}

const saveAsNewCommand = () => {
  if (!builtCommand.value.trim() || !selectedCommand.value) {
    toast.warning('没有可保存的命令')
    return
  }
  
  const newCommand = {
    name: `${selectedCommand.value.name} (构建)`,
    command: builtCommand.value.trim(),
    description: `基于 ${selectedCommand.value.name} 构建的命令`,
    category: selectedCommand.value.category,
    tags: [...(selectedCommand.value.tags || []), '构建', '自定义'],
    parameters: selectedCommand.value.parameters?.map(param => ({
      ...param,
      defaultValue: parameterValues.value[param.name] || param.defaultValue
    })) || [],
    options: selectedCommand.value.options || [],
    isUserCreated: true
  }
  
  emit('save', newCommand)
  showSaveSuccess()
  handleClose()
}

const handleClose = () => {
  emit('update:visible', false)
  resetBuilder()
}

// 监听器
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.command) {
    selectedCommand.value = props.command
    initializeFromCommand(props.command)
  }
})

watch(dialogVisible, (newVal) => {
  if (!newVal) {
    emit('update:visible', false)
  }
})

// 生命周期
onMounted(() => {
  if (props.visible && props.command) {
    selectedCommand.value = props.command
    initializeFromCommand(props.command)
  }
})
</script>

<style lang="scss" scoped>
.command-builder {
  .builder-header {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
    
    .selector-group {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
      
      label {
        font-weight: 500;
        margin-right: 8px;
      }
    }
  }
  
  .template-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: var(--el-color-primary-light-9);
    border-radius: var(--el-border-radius-base);
    border-left: 4px solid var(--el-color-primary);
    
    h4 {
      margin: 0;
      color: var(--el-color-primary);
    }
    
    .template-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .command-workspace {
    .command-preview {
      margin-bottom: 24px;
      
      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        h4 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--el-text-color-primary);
        }
        
        .preview-stats {
          display: flex;
          gap: 8px;
        }
      }
      
      .command-output {
        margin-bottom: 12px;
        
        :deep(.el-textarea__inner) {
          background-color: var(--el-fill-color-darker);
          border: 1px solid var(--el-border-color-light);
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
        }
      }
      
      .command-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .builder-sections {
      .builder-section {
        margin-bottom: 24px;
        
        h4 {
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--el-text-color-primary);
          font-size: 16px;
        }
        
        .command-buttons,
        .option-buttons,
        .parameter-buttons,
        .separator-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          
          .el-button {
            &.is-active {
              background: var(--el-color-success);
              border-color: var(--el-color-success);
              color: white;
            }
            
            code {
              font-family: 'Consolas', 'Monaco', monospace;
              background: rgba(255, 255, 255, 0.2);
              padding: 2px 4px;
              border-radius: 2px;
              margin-right: 4px;
            }
          }
        }
        
        .parameter-inputs {
          .parameter-input-group {
            margin-bottom: 16px;
            
            label {
              display: block;
              margin-bottom: 8px;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .input-with-actions {
              display: flex;
              gap: 8px;
              align-items: center;
              
              .el-input {
                flex: 1;
              }
            }
            
            .param-help {
              margin-top: 4px;
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }
        }
        
        .manual-input {
          .el-input {
            max-width: 400px;
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .footer-info {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
  
  .footer-actions {
    display: flex;
    gap: 8px;
  }
}

// 工具提示样式
.el-tooltip__popper {
  max-width: 300px;
}
</style> 