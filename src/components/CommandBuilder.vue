<template>
  <div class="simplified-command-builder">
    <!-- 命令模板基本信息 -->
    <el-card class="builder-card">
      <template #header>
        <span>基本信息</span>
      </template>
      
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input
            v-model="template.name"
            placeholder="请输入命令模板名称"
            @input="onTemplateChange"
          />
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select
            v-model="template.category"
            placeholder="请选择分类"
            @change="onTemplateChange"
          >
            <el-option label="版本控制" value="version-control" />
            <el-option label="容器管理" value="container" />
            <el-option label="文件系统" value="filesystem" />
            <el-option label="网络工具" value="network" />
            <el-option label="系统管理" value="system" />
            <el-option label="开发工具" value="development" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标签">
          <el-tag
            v-for="tag in template.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            style="margin-right: 8px;"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInput"
            v-model="tagInputValue"
            size="small"
            style="width: 100px;"
            @keyup.enter="addTag"
            @blur="addTag"
          />
          <el-button
            v-else
            size="small"
            @click="showTagInput"
          >
            + 新标签
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 子命令配置（可选） -->
    <el-card class="builder-card">
      <template #header>
        <div class="card-header">
          <span>子命令</span>
          <el-button type="primary" size="small" @click="addSubcommand" icon="Plus">
            添加子命令
          </el-button>
        </div>
      </template>
      
      <div v-if="template.subcommands.length === 0" class="empty-state">
        <el-empty description="暂无子命令" :image-size="60" />
      </div>
      
      <div v-else class="subcommands-list">
        <div
          v-for="(subcommand, index) in template.subcommands"
          :key="index"
          class="subcommand-item"
        >
          <el-input
            v-model="subcommand.name"
            placeholder="子命令名"
            @input="onTemplateChange"
          />
          <el-input
            v-model="subcommand.description"
            placeholder="描述"
            @input="onTemplateChange"
          />
          <el-select
            v-model="subcommand.type"
            @change="onTemplateChange"
          >
            <el-option label="可选" :value="ParameterType.OPTIONAL" />
            <el-option label="必需" :value="ParameterType.REQUIRED" />
          </el-select>
          <el-button
            type="danger"
            size="small"
            icon="Delete"
            @click="removeSubcommand(index)"
          />
        </div>
      </div>
    </el-card>

    <!-- 选项配置（可选） -->
    <el-card class="builder-card">
      <template #header>
        <div class="card-header">
          <span>选项</span>
          <el-button type="primary" size="small" @click="addOption" icon="Plus">
            添加选项
          </el-button>
        </div>
      </template>
      
      <div v-if="template.options.length === 0" class="empty-state">
        <el-empty description="暂无选项" :image-size="60" />
      </div>
      
      <div v-else class="options-list">
        <div
          v-for="(option, index) in template.options"
          :key="index"
          class="option-item"
        >
          <div class="option-row">
            <el-input
              v-model="option.name"
              placeholder="选项名"
              @input="onTemplateChange"
            />
            <el-input
              v-model="option.shortFlag"
              placeholder="短标志 (如: -f)"
              @input="onTemplateChange"
            />
            <el-input
              v-model="option.longFlag"
              placeholder="长标志 (如: --force)"
              @input="onTemplateChange"
            />
            <el-button
              type="danger"
              size="small"
              icon="Delete"
              @click="removeOption(index)"
            />
          </div>
          <div class="option-row">
            <el-input
              v-model="option.description"
              placeholder="描述"
              @input="onTemplateChange"
            />
            <el-checkbox
              v-model="option.hasParameter"
              @change="onTemplateChange"
            >
              需要参数
            </el-checkbox>
            <el-select
              v-model="option.type"
              @change="onTemplateChange"
            >
              <el-option label="可选" :value="ParameterType.OPTIONAL" />
              <el-option label="必需" :value="ParameterType.REQUIRED" />
            </el-select>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 参数配置（可选） -->
    <el-card class="builder-card">
      <template #header>
        <div class="card-header">
          <span>参数</span>
          <el-button type="primary" size="small" @click="addParameter" icon="Plus">
            添加参数
          </el-button>
        </div>
      </template>
      
      <div v-if="template.parameters.length === 0" class="empty-state">
        <el-empty description="暂无参数" :image-size="60" />
      </div>
      
      <div v-else class="parameters-list">
        <div
          v-for="(parameter, index) in template.parameters"
          :key="index"
          class="parameter-item"
        >
          <el-input
            v-model="parameter.name"
            placeholder="参数名"
            @input="onTemplateChange"
          />
          <el-input
            v-model="parameter.description"
            placeholder="描述"
            @input="onTemplateChange"
          />
          <el-input
            v-model="parameter.placeholder"
            placeholder="占位符"
            @input="onTemplateChange"
          />
          <el-select
            v-model="parameter.dataType"
            @change="onTemplateChange"
          >
            <el-option label="字符串" :value="DataType.STRING" />
            <el-option label="数字" :value="DataType.NUMBER" />
            <el-option label="文件路径" :value="DataType.FILE" />
            <el-option label="目录路径" :value="DataType.DIRECTORY" />
            <el-option label="URL" :value="DataType.URL" />
          </el-select>
          <el-select
            v-model="parameter.type"
            @change="onTemplateChange"
          >
            <el-option label="可选" :value="ParameterType.OPTIONAL" />
            <el-option label="必需" :value="ParameterType.REQUIRED" />
          </el-select>
          <el-button
            type="danger"
            size="small"
            icon="Delete"
            @click="removeParameter(index)"
          />
        </div>
      </div>
    </el-card>

    <!-- 符号配置（可选） -->
    <el-card class="builder-card">
      <template #header>
        <div class="card-header">
          <span>符号</span>
          <el-button type="primary" size="small" @click="showSymbolDialog = true" icon="Plus">
            添加符号
          </el-button>
        </div>
      </template>
      
      <div v-if="template.symbols.length === 0" class="empty-state">
        <el-empty description="暂无符号" :image-size="60" />
      </div>
      
      <div v-else class="symbols-list">
        <el-tag
          v-for="(symbol, index) in template.symbols"
          :key="index"
          closable
          @close="removeSymbol(index)"
          :type="getSymbolTagType(symbol.category)"
          style="margin: 4px;"
        >
          {{ symbol.symbol }} - {{ symbol.name }}
        </el-tag>
      </div>
    </el-card>

    <!-- 常用完整命令 -->
    <el-card class="builder-card">
      <template #header>
        <div class="card-header">
          <span>常用完整命令</span>
          <el-button type="primary" size="small" @click="addCommonCommand" icon="Plus">
            添加常用命令
          </el-button>
        </div>
      </template>
      
      <div v-if="template.commonCommands.length === 0" class="empty-state">
        <el-empty description="暂无常用命令" :image-size="60" />
      </div>
      
      <div v-else class="common-commands-list">
        <div
          v-for="(command, index) in template.commonCommands"
          :key="index"
          class="common-command-item"
        >
          <el-input
            v-model="command.name"
            placeholder="命令名称"
            @input="onTemplateChange"
          />
          <el-input
            v-model="command.command"
            placeholder="完整命令"
            @input="onTemplateChange"
          />
          <el-input
            v-model="command.description"
            placeholder="描述"
            @input="onTemplateChange"
          />
          <el-button
            type="danger"
            size="small"
            icon="Delete"
            @click="removeCommonCommand(index)"
          />
        </div>
      </div>
    </el-card>

    <!-- 预览和操作 -->
    <el-card class="builder-card">
      <template #header>
        <span>模板预览</span>
      </template>
      
      <div class="template-preview">
        <pre>{{ JSON.stringify(template, null, 2) }}</pre>
      </div>
      
      <div class="actions">
        <el-button type="primary" @click="saveTemplate">保存模板</el-button>
        <el-button @click="resetTemplate">重置</el-button>
        <el-button type="success" @click="useTemplate">使用模板</el-button>
      </div>
    </el-card>

    <!-- 符号选择对话框 -->
    <el-dialog
      v-model="showSymbolDialog"
      title="选择符号"
      width="800px"
    >
      <div class="symbol-categories">
        <div
          v-for="(symbols, category) in PredefinedSymbols"
          :key="category"
          class="symbol-category"
        >
          <h4>{{ getCategoryName(category) }}</h4>
          <div class="symbol-items">
            <div
              v-for="symbol in symbols"
              :key="symbol.symbol"
              class="symbol-item"
              @click="selectSymbol(symbol, category)"
            >
              <span class="symbol-text">{{ symbol.symbol }}</span>
              <span class="symbol-name">{{ symbol.name }}</span>
              <span class="symbol-desc">{{ symbol.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import {
  CommandTemplate,
  CommandBuilder,
  TemplateFactory,
  SymbolCategory,
  PredefinedSymbols,
  ParameterType,
  DataType
} from '../utils/commandBuilder.js'

// Props
const props = defineProps({
  initialTemplate: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['template-created', 'template-changed'])

// 响应式数据
const template = reactive(new CommandTemplate(props.initialTemplate))
const showSymbolDialog = ref(false)

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInput = ref()

// 方法
const onTemplateChange = () => {
  emit('template-changed', template.toConfig())
}

// 标签管理
const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !template.tags.includes(tag)) {
    template.tags.push(tag)
    onTemplateChange()
  }
  tagInputValue.value = ''
  tagInputVisible.value = false
}

const removeTag = (tag) => {
  const index = template.tags.indexOf(tag)
  if (index > -1) {
    template.tags.splice(index, 1)
    onTemplateChange()
  }
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInput.value?.focus()
  })
}

// 子命令管理
const addSubcommand = () => {
  template.subcommands.push({
    name: '',
    description: '',
    type: ParameterType.OPTIONAL
  })
  onTemplateChange()
}

const removeSubcommand = (index) => {
  template.subcommands.splice(index, 1)
  onTemplateChange()
}

// 选项管理
const addOption = () => {
  template.options.push({
    name: '',
    shortFlag: '',
    longFlag: '',
    description: '',
    type: ParameterType.OPTIONAL,
    hasParameter: false,
    parameterType: DataType.STRING
  })
  onTemplateChange()
}

const removeOption = (index) => {
  template.options.splice(index, 1)
  onTemplateChange()
}

// 参数管理
const addParameter = () => {
  template.parameters.push({
    name: '',
    description: '',
    type: ParameterType.OPTIONAL,
    dataType: DataType.STRING,
    placeholder: ''
  })
  onTemplateChange()
}

const removeParameter = (index) => {
  template.parameters.splice(index, 1)
  onTemplateChange()
}

// 符号管理
const selectSymbol = (symbol, category) => {
  template.symbols.push({
    symbol: symbol.symbol,
    name: symbol.name,
    description: symbol.description,
    category: category
  })
  showSymbolDialog.value = false
  onTemplateChange()
}

const removeSymbol = (index) => {
  template.symbols.splice(index, 1)
  onTemplateChange()
}

const getSymbolTagType = (category) => {
  const typeMap = {
    [SymbolCategory.PIPE]: 'primary',
    [SymbolCategory.REDIRECT]: 'success',
    [SymbolCategory.LOGIC]: 'warning',
    [SymbolCategory.BACKGROUND]: 'info',
    [SymbolCategory.GROUPING]: 'danger',
    [SymbolCategory.WILDCARD]: 'default'
  }
  return typeMap[category] || 'default'
}

const getCategoryName = (category) => {
  const nameMap = {
    [SymbolCategory.PIPE]: '管道符号',
    [SymbolCategory.REDIRECT]: '重定向符号',
    [SymbolCategory.LOGIC]: '逻辑操作符',
    [SymbolCategory.BACKGROUND]: '后台运行',
    [SymbolCategory.GROUPING]: '分组符号',
    [SymbolCategory.WILDCARD]: '通配符'
  }
  return nameMap[category] || category
}

// 常用命令管理
const addCommonCommand = () => {
  template.commonCommands.push({
    name: '',
    command: '',
    description: '',
    frequency: 0
  })
  onTemplateChange()
}

const removeCommonCommand = (index) => {
  template.commonCommands.splice(index, 1)
  onTemplateChange()
}

// 模板操作
const saveTemplate = () => {
  if (!template.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  
  emit('template-created', template.toConfig())
  ElMessage.success('模板保存成功')
}

const resetTemplate = () => {
  Object.assign(template, new CommandTemplate())
  onTemplateChange()
  ElMessage.info('模板已重置')
}

const useTemplate = () => {
  if (!template.name.trim()) {
    ElMessage.warning('请先完善模板信息')
    return
  }
  
  const builder = new CommandBuilder(template)
  ElMessage.success('模板已应用到构建器')
  // 这里可以触发使用模板的逻辑
}
</script>

<style scoped>
.simplified-command-builder {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.builder-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 20px;
}

.subcommand-item,
.option-item,
.parameter-item,
.common-command-item {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.option-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.option-item {
  flex-direction: column;
  align-items: stretch;
}

.symbols-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-preview {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow: auto;
}

.template-preview pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.symbol-categories {
  max-height: 400px;
  overflow-y: auto;
}

.symbol-category {
  margin-bottom: 20px;
}

.symbol-category h4 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.symbol-items {
  display: grid;
  gap: 8px;
}

.symbol-item {
  display: grid;
  grid-template-columns: 60px 120px 1fr;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.symbol-item:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.symbol-text {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #e6a23c;
}

.symbol-name {
  font-weight: 500;
  color: #303133;
}

.symbol-desc {
  font-size: 12px;
  color: #909399;
}
</style> 