<template>
  <div class="advanced-command-builder">
    <!-- 构建器头部 -->
    <div class="builder-header">
      <div class="mode-switcher">
        <el-radio-group v-model="builderMode" @change="handleModeChange">
          <el-radio-button label="create">创建新命令</el-radio-button>
          <el-radio-button label="build">构建现有命令</el-radio-button>
          <el-radio-button label="template">使用模板</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="quick-actions">
        <el-button @click="clearAll" type="info" size="small">清空</el-button>
        <el-button @click="saveAsTemplate" type="warning" size="small">保存为模板</el-button>
        <el-button @click="validateCommand" type="primary" size="small">验证命令</el-button>
      </div>
    </div>

    <!-- 命令预览区 -->
    <div class="command-preview-section">
      <div class="preview-header">
        <span class="preview-label">构建的命令</span>
        <div class="preview-actions">
          <el-button size="small" @click="copyCommand">复制</el-button>
          <el-button size="small" @click="executeCommand" type="primary">执行</el-button>
        </div>
      </div>
      
      <div class="command-display">
        <el-input
          v-model="builtCommand"
          type="textarea"
          :rows="3"
          placeholder="在下方选择选项构建命令..."
          class="command-textarea"
          @input="handleCommandChange"
        />
        
        <!-- 命令分析结果 -->
        <div v-if="commandAnalysis" class="command-analysis">
          <div class="analysis-item" v-for="(item, index) in commandAnalysis" :key="index">
            <span :class="['analysis-type', item.type]">{{ item.type }}</span>
            <span class="analysis-text">{{ item.text }}</span>
            <span v-if="item.description" class="analysis-desc">{{ item.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 构建选项区域 -->
    <div class="builder-content">
      <!-- 基础命令选择 -->
      <div v-if="builderMode === 'create' || builderMode === 'template'" class="section base-command-section">
        <h3 class="section-title">🔧 基础命令</h3>
        <div class="base-command-input">
          <el-input
            v-model="baseCommand"
            placeholder="输入基础命令（如 git, docker, npm）"
            @input="handleBaseCommandChange"
          >
            <template #prepend>命令</template>
          </el-input>
        </div>
      </div>

      <!-- 参数定义区 -->
      <div class="section parameters-section">
        <h3 class="section-title">📝 参数定义</h3>
        
        <!-- 参数列表 -->
        <div class="parameters-list">
          <div 
            v-for="(param, index) in parameters" 
            :key="index"
            class="parameter-item"
            :class="{ 'required': param.required }"
          >
            <div class="param-header">
              <el-input
                v-model="param.name"
                placeholder="参数名称"
                size="small"
                class="param-name"
                @input="updateCommandTemplate"
              />
              
              <el-select
                v-model="param.type"
                placeholder="类型"
                size="small"
                class="param-type"
              >
                <el-option label="字符串" value="string" />
                <el-option label="数字" value="number" />
                <el-option label="文件" value="file" />
                <el-option label="目录" value="directory" />
                <el-option label="URL" value="url" />
                <el-option label="布尔" value="boolean" />
              </el-select>
              
              <div class="param-controls">
                <el-tooltip content="必选参数">
                  <el-checkbox 
                    v-model="param.required" 
                    @change="updateCommandTemplate"
                  >
                    必选
                  </el-checkbox>
                </el-tooltip>
                
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeParameter(index)"
                  circle
                >
                  ×
                </el-button>
              </div>
            </div>
            
            <div class="param-details">
              <el-input
                v-model="param.description"
                placeholder="参数描述"
                size="small"
                class="param-desc"
              />
              
              <el-input
                v-model="param.defaultValue"
                placeholder="默认值（可选参数）"
                size="small"
                class="param-default"
                :disabled="param.required"
              />
            </div>
            
            <!-- 参数值输入 -->
            <div class="param-value-input">
              <el-input
                v-model="parameterValues[param.name]"
                :placeholder="`输入${param.name}的值`"
                size="small"
                @input="updateBuiltCommand"
              >
                <template #prepend>值</template>
                <template #append>
                  <el-button @click="insertParameterToCommand(param.name)">插入</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
        
        <el-button @click="addParameter" type="primary" size="small" class="add-param-btn">
          + 添加参数
        </el-button>
      </div>

      <!-- 选项定义区 -->
      <div class="section options-section">
        <h3 class="section-title">⚙️ 命令选项</h3>
        
        <div class="options-list">
          <div 
            v-for="(option, index) in options" 
            :key="index"
            class="option-item"
          >
            <div class="option-header">
              <el-input
                v-model="option.flag"
                placeholder="选项标志（如 -v, --verbose）"
                size="small"
                class="option-flag"
              />
              
              <div class="option-controls">
                <el-checkbox v-model="option.hasValue">带值</el-checkbox>
                <el-checkbox v-model="option.required">必选</el-checkbox>
                
                <el-button 
                  :type="selectedOptions.has(option.flag) ? 'primary' : 'default'"
                  size="small"
                  @click="toggleOption(option.flag)"
                >
                  {{ selectedOptions.has(option.flag) ? '已选' : '选择' }}
                </el-button>
                
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeOption(index)"
                  circle
                >
                  ×
                </el-button>
              </div>
            </div>
            
            <el-input
              v-model="option.description"
              placeholder="选项描述"
              size="small"
              class="option-desc"
            />
          </div>
        </div>
        
        <el-button @click="addOption" type="primary" size="small">
          + 添加选项
        </el-button>
      </div>

      <!-- 分隔符选择区 -->
      <div class="section separators-section">
        <h3 class="section-title">🔗 分隔符与组合</h3>
        
        <div class="separators-grid">
          <div 
            v-for="separator in availableSeparators" 
            :key="separator.symbol"
            class="separator-item"
            :class="{ 'selected': selectedSeparators.has(separator.symbol) }"
            @click="toggleSeparator(separator.symbol)"
          >
            <div class="separator-symbol">{{ separator.symbol }}</div>
            <div class="separator-name">{{ separator.name }}</div>
            <div class="separator-desc">{{ separator.description }}</div>
          </div>
        </div>
      </div>

      <!-- 常用组合区 -->
      <div class="section common-combinations-section">
        <h3 class="section-title">🌟 常用组合</h3>
        
        <div class="combinations-list">
          <div 
            v-for="(combo, index) in commonCombinations" 
            :key="index"
            class="combination-item"
            @click="applyCommonCombination(combo)"
          >
            <div class="combo-name">{{ combo.name }}</div>
            <div class="combo-command">{{ combo.command }}</div>
            <div class="combo-desc">{{ combo.description }}</div>
          </div>
        </div>
        
        <div class="add-combination">
          <el-button @click="addCurrentAsCommonCombination" type="warning" size="small">
            将当前命令保存为常用组合
          </el-button>
        </div>
      </div>
    </div>

    <!-- 高级选项 -->
    <div class="advanced-options">
      <el-collapse>
        <el-collapse-item title="高级选项" name="advanced">
          <!-- 命令验证规则 -->
          <div class="validation-rules">
            <h4>验证规则</h4>
            <el-checkbox v-model="validationOptions.checkSyntax">语法检查</el-checkbox>
            <el-checkbox v-model="validationOptions.checkDependencies">依赖检查</el-checkbox>
            <el-checkbox v-model="validationOptions.checkConflicts">冲突检查</el-checkbox>
          </div>
          
          <!-- 执行环境 -->
          <div class="execution-environment">
            <h4>执行环境</h4>
            <el-select v-model="executionEnvironment" placeholder="选择执行环境">
              <el-option label="Bash" value="bash" />
              <el-option label="PowerShell" value="powershell" />
              <el-option label="CMD" value="cmd" />
              <el-option label="Zsh" value="zsh" />
            </el-select>
          </div>
          
          <!-- 安全级别 -->
          <div class="security-level">
            <h4>安全级别</h4>
            <el-radio-group v-model="securityLevel">
              <el-radio label="low">低（直接执行）</el-radio>
              <el-radio label="medium">中（确认后执行）</el-radio>
              <el-radio label="high">高（禁止危险命令）</el-radio>
            </el-radio-group>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 底部操作栏 -->
    <div class="builder-footer">
      <div class="footer-left">
        <el-button @click="loadTemplate">加载模板</el-button>
        <el-button @click="exportCommand">导出命令</el-button>
      </div>
      
      <div class="footer-right">
        <el-button @click="previewCommand" type="info">预览</el-button>
        <el-button @click="saveCommand" type="success">保存命令</el-button>
        <el-button @click="buildAndExecute" type="primary">构建并执行</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useCommandStore } from '../stores/command'
import { toast } from '../utils/toast'

// Props
const props = defineProps({
  visible: Boolean,
  command: Object // 基于现有命令构建时传入
})

// Emits
const emit = defineEmits(['close', 'save', 'execute'])

// Store
const commandStore = useCommandStore()

// 响应式数据
const builderMode = ref('create') // create | build | template
const baseCommand = ref('')
const builtCommand = ref('')
const parameters = ref([])
const options = ref([])
const parameterValues = ref({})
const selectedOptions = ref(new Set())
const selectedSeparators = ref(new Set())
const commonCombinations = ref([])

// 验证和执行选项
const validationOptions = ref({
  checkSyntax: true,
  checkDependencies: true,
  checkConflicts: true
})
const executionEnvironment = ref('bash')
const securityLevel = ref('medium')

// 可用分隔符
const availableSeparators = ref([
  {
    symbol: '|',
    name: '管道符',
    description: '将前一个命令的输出传递给后一个命令'
  },
  {
    symbol: '&&',
    name: '逻辑与',
    description: '前一个命令成功时才执行后一个命令'
  },
  {
    symbol: '||',
    name: '逻辑或',
    description: '前一个命令失败时才执行后一个命令'
  },
  {
    symbol: ';',
    name: '顺序执行',
    description: '按顺序执行命令，不管前一个是否成功'
  },
  {
    symbol: '&',
    name: '后台执行',
    description: '在后台执行命令'
  }
])

// 命令分析结果
const commandAnalysis = computed(() => {
  if (!builtCommand.value) return null
  
  const parts = analyzeCommand(builtCommand.value)
  return parts
})

// 方法定义
const handleModeChange = (mode) => {
  // 模式切换逻辑
  switch (mode) {
    case 'create':
      clearAll()
      break
    case 'build':
      // 加载现有命令
      if (props.command) {
        loadExistingCommand(props.command)
      }
      break
    case 'template':
      // 显示模板选择
      showTemplateSelector()
      break
  }
}

const addParameter = () => {
  parameters.value.push({
    name: '',
    description: '',
    required: false,
    defaultValue: '',
    type: 'string'
  })
}

const removeParameter = (index) => {
  parameters.value.splice(index, 1)
  updateCommandTemplate()
}

const addOption = () => {
  options.value.push({
    flag: '',
    description: '',
    required: false,
    hasValue: false
  })
}

const removeOption = (index) => {
  options.value.splice(index, 1)
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

const toggleSeparator = (symbol) => {
  if (selectedSeparators.value.has(symbol)) {
    selectedSeparators.value.delete(symbol)
    removeFromCommand(symbol)
  } else {
    selectedSeparators.value.add(symbol)
    addToCommand(` ${symbol} `)
  }
}

const updateCommandTemplate = () => {
  let template = baseCommand.value
  
  // 添加选中的选项
  selectedOptions.value.forEach(flag => {
    template += ` ${flag}`
  })
  
  // 添加参数占位符
  parameters.value.forEach(param => {
    if (param.name) {
      template += ` {{${param.name}}}`
    }
  })
  
  builtCommand.value = template
  updateBuiltCommand()
}

const updateBuiltCommand = () => {
  let command = builtCommand.value
  
  // 替换参数占位符
  Object.keys(parameterValues.value).forEach(paramName => {
    const value = parameterValues.value[paramName]
    if (value) {
      const placeholder = `{{${paramName}}}`
      command = command.replace(new RegExp(placeholder, 'g'), value)
    }
  })
  
  // 触发命令分析
  builtCommand.value = command
}

const insertParameterToCommand = (paramName) => {
  const value = parameterValues.value[paramName]
  if (value) {
    builtCommand.value += ` ${value}`
  } else {
    builtCommand.value += ` {{${paramName}}}`
  }
}

const addToCommand = (text) => {
  if (builtCommand.value.trim()) {
    builtCommand.value += ` ${text}`
  } else {
    builtCommand.value = text
  }
}

const removeFromCommand = (text) => {
  const patterns = [
    ` ${text} `,
    ` ${text}`,
    `${text} `,
    text
  ]
  
  for (const pattern of patterns) {
    if (builtCommand.value.includes(pattern)) {
      builtCommand.value = builtCommand.value.replace(pattern, ' ')
      break
    }
  }
  
  builtCommand.value = builtCommand.value.replace(/\s+/g, ' ').trim()
}

const analyzeCommand = (command) => {
  const parts = []
  const tokens = command.split(/\s+/)
  
  tokens.forEach((token, index) => {
    if (token.startsWith('-')) {
      parts.push({
        type: 'option',
        text: token,
        description: '命令选项'
      })
    } else if (token.match(/^{{.*}}$/)) {
      parts.push({
        type: 'parameter',
        text: token,
        description: '参数占位符'
      })
    } else if (['|', '&&', '||', ';', '&'].includes(token)) {
      parts.push({
        type: 'separator',
        text: token,
        description: '分隔符'
      })
    } else if (index === 0) {
      parts.push({
        type: 'command',
        text: token,
        description: '基础命令'
      })
    } else {
      parts.push({
        type: 'argument',
        text: token,
        description: '命令参数'
      })
    }
  })
  
  return parts
}

const validateCommand = () => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  }
  
  // 检查必选参数
  parameters.value.forEach(param => {
    if (param.required && !parameterValues.value[param.name]) {
      validation.errors.push(`必选参数 "${param.name}" 未提供值`)
      validation.isValid = false
    }
  })
  
  // 检查语法
  if (validationOptions.value.checkSyntax) {
    if (!builtCommand.value.trim()) {
      validation.errors.push('命令不能为空')
      validation.isValid = false
    }
  }
  
  // 显示验证结果
  if (validation.isValid) {
    toast.success('命令验证通过')
  } else {
    toast.error(`验证失败: ${validation.errors.join(', ')}`)
  }
  
  return validation
}

const saveCommand = () => {
  const validation = validateCommand()
  if (!validation.isValid) return
  
  const commandData = {
    name: `${baseCommand.value} 命令`,
    command: buildFinalCommand(),
    description: '用户创建的命令',
    category: 'user-created',
    tags: [baseCommand.value],
    parameters: parameters.value.filter(p => p.name),
    options: options.value.filter(o => o.flag),
    isUserCreated: true
  }
  
  commandStore.addCommand(commandData)
  toast.success('命令保存成功')
  emit('save', commandData)
}

const buildFinalCommand = () => {
  let command = baseCommand.value
  
  // 添加选中的选项
  selectedOptions.value.forEach(flag => {
    command += ` ${flag}`
  })
  
  // 添加参数（使用实际值或占位符）
  parameters.value.forEach(param => {
    if (param.name) {
      const value = parameterValues.value[param.name]
      if (value) {
        command += ` ${value}`
      } else if (param.required) {
        command += ` {{${param.name}}}`
      } else if (param.defaultValue) {
        command += ` ${param.defaultValue}`
      }
    }
  })
  
  return command
}

const clearAll = () => {
  baseCommand.value = ''
  builtCommand.value = ''
  parameters.value = []
  options.value = []
  parameterValues.value = {}
  selectedOptions.value.clear()
  selectedSeparators.value.clear()
}

const copyCommand = () => {
  navigator.clipboard.writeText(builtCommand.value)
  toast.success('命令已复制到剪贴板')
}

const executeCommand = () => {
  const validation = validateCommand()
  if (!validation.isValid) return
  
  emit('execute', builtCommand.value)
}

// 监听器
watch(() => props.command, (newCommand) => {
  if (newCommand && props.visible) {
    loadExistingCommand(newCommand)
  }
})

watch(() => props.visible, (visible) => {
  if (visible && builderMode.value === 'create') {
    clearAll()
  }
})
</script>

<style lang="scss" scoped>
.advanced-command-builder {
  .builder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--el-spacing-lg);
    padding: var(--el-spacing-md);
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
  }
  
  .command-preview-section {
    margin-bottom: var(--el-spacing-lg);
    
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--el-spacing-sm);
      
      .preview-label {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
    
    .command-display {
      .command-textarea {
        :deep(.el-textarea__inner) {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          background: var(--el-fill-color-lighter);
          border: 2px solid var(--el-border-color);
          
          &:focus {
            border-color: var(--el-color-primary);
          }
        }
      }
      
      .command-analysis {
        margin-top: var(--el-spacing-sm);
        padding: var(--el-spacing-sm);
        background: var(--el-fill-color-blank);
        border: 1px solid var(--el-border-color-light);
        border-radius: var(--el-border-radius-base);
        
        .analysis-item {
          display: flex;
          align-items: center;
          gap: var(--el-spacing-sm);
          margin-bottom: var(--el-spacing-xs);
          
          .analysis-type {
            padding: 2px 6px;
            border-radius: var(--el-border-radius-small);
            font-size: var(--el-font-size-extra-small);
            font-weight: 600;
            
            &.command {
              background: var(--el-color-primary-light-9);
              color: var(--el-color-primary);
            }
            
            &.option {
              background: var(--el-color-success-light-9);
              color: var(--el-color-success);
            }
            
            &.parameter {
              background: var(--el-color-warning-light-9);
              color: var(--el-color-warning);
            }
            
            &.separator {
              background: var(--el-color-info-light-9);
              color: var(--el-color-info);
            }
            
            &.argument {
              background: var(--el-color-danger-light-9);
              color: var(--el-color-danger);
            }
          }
          
          .analysis-text {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-weight: 600;
          }
          
          .analysis-desc {
            color: var(--el-text-color-secondary);
            font-size: var(--el-font-size-small);
          }
        }
      }
    }
  }
  
  .section {
    margin-bottom: var(--el-spacing-lg);
    padding: var(--el-spacing-md);
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    
    .section-title {
      margin: 0 0 var(--el-spacing-md) 0;
      font-size: var(--el-font-size-large);
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--el-border-color-light);
      padding-bottom: var(--el-spacing-sm);
    }
  }
  
  .parameter-item, .option-item {
    margin-bottom: var(--el-spacing-md);
    padding: var(--el-spacing-sm);
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
    
    &.required {
      border-left: 4px solid var(--el-color-danger);
    }
    
    .param-header, .option-header {
      display: flex;
      gap: var(--el-spacing-sm);
      margin-bottom: var(--el-spacing-sm);
      align-items: center;
    }
    
    .param-details {
      display: flex;
      gap: var(--el-spacing-sm);
      margin-bottom: var(--el-spacing-sm);
    }
    
    .param-value-input {
      margin-top: var(--el-spacing-sm);
    }
  }
  
  .separators-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--el-spacing-sm);
    
    .separator-item {
      padding: var(--el-spacing-sm);
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color);
      border-radius: var(--el-border-radius-base);
      cursor: pointer;
      transition: all var(--el-transition-duration);
      
      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
      
      &.selected {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-8);
      }
      
      .separator-symbol {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: var(--el-font-size-large);
        font-weight: 600;
        color: var(--el-color-primary);
        margin-bottom: var(--el-spacing-xs);
      }
      
      .separator-name {
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: var(--el-spacing-xs);
      }
      
      .separator-desc {
        font-size: var(--el-font-size-small);
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .combinations-list {
    .combination-item {
      padding: var(--el-spacing-sm);
      background: var(--el-fill-color-light);
      border: 1px solid var(--el-border-color);
      border-radius: var(--el-border-radius-base);
      margin-bottom: var(--el-spacing-sm);
      cursor: pointer;
      transition: all var(--el-transition-duration);
      
      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
      
      .combo-name {
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: var(--el-spacing-xs);
      }
      
      .combo-command {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        background: var(--el-fill-color-darker);
        padding: var(--el-spacing-xs);
        border-radius: var(--el-border-radius-small);
        margin-bottom: var(--el-spacing-xs);
      }
      
      .combo-desc {
        font-size: var(--el-font-size-small);
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .builder-footer {
    display: flex;
    justify-content: space-between;
    margin-top: var(--el-spacing-lg);
    padding: var(--el-spacing-md);
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
    
    .footer-left, .footer-right {
      display: flex;
      gap: var(--el-spacing-sm);
    }
  }
}
</style> 