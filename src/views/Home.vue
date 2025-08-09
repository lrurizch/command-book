<template>
  <div class="home">
    <!-- 顶部搜索栏 - 始终在最上方 -->
    <div class="top-search-section">
      <div class="search-bar">
        <el-input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索命令... (Ctrl+K)"
          @input="onSearchInput"
          @keyup.enter="handleSearchEnter"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <!-- 搜索历史下拉 -->
        <el-dropdown v-if="commandStore.searchHistory.length > 0" trigger="click" @command="selectSearchHistory">
          <el-button type="text" class="search-history-btn">
            <el-icon><Clock /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item 
                v-for="(item, index) in commandStore.searchHistory.slice(0, 10)" 
                :key="index"
                :command="item"
              >
                {{ item }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="clearSearchHistory">
                <el-icon><Delete /></el-icon>
                清空历史
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <div class="action-buttons">
        <el-button type="success" @click="handleAddClick">
          <el-icon><Plus /></el-icon>
          {{ showAddModal ? '取消新建' : '新建命令' }}
        </el-button>
        <el-button type="primary" @click="handleBatchClick">
          <el-icon><DocumentAdd /></el-icon>
          {{ showBatchCreateModal ? '取消批量' : '批量新增' }}
        </el-button>
        <el-button type="warning" @click="handleBuilderClick">
          <el-icon><Tools /></el-icon>
          {{ showBuilderModal && !builderCommand ? '取消构建器' : '命令构建器' }}
        </el-button>
        <el-button type="info" @click="handleWorkflowClick">
          <el-icon><Connection /></el-icon>
          {{ showWorkflowModal ? '取消工作流' : '新建工作流' }}
        </el-button>
        
        <!-- 设置按钮 (固定在右上角) -->
        <div class="settings-wrapper">
          <el-tooltip content="应用设置" placement="bottom">
            <el-button
              :icon="Setting"
              circle
              class="settings-btn"
              type="default"
              @click="handleOpenSettings"
            />
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 标签筛选栏 -->
    <div class="tag-section" v-if="commandStore.allTags.length > 0">
      <div class="tag-header">
        <span>标签筛选:</span>
        <el-button 
          v-if="selectedTags.length > 0" 
          type="text" 
          size="small" 
          @click="clearTags"
        >
          清除全部
        </el-button>
      </div>
      <div class="tag-list">
        <el-tag
          v-for="tag in commandStore.allTags.slice(0, 20)"
          :key="tag.name"
          :type="selectedTags.includes(tag.name) ? 'primary' : 'info'"
          :effect="selectedTags.includes(tag.name) ? 'dark' : 'plain'"
          @click="toggleTag(tag.name)"
          class="tag-item"
          closable
          @close="removeTag(tag.name)"
        >
          {{ tag.name }} ({{ tag.count }})
        </el-tag>
        <el-button 
          v-if="commandStore.allTags.length > 20" 
          type="text" 
          size="small"
          @click="showAllTags = !showAllTags"
        >
          {{ showAllTags ? '收起' : `显示全部 ${commandStore.allTags.length} 个标签` }}
        </el-button>
      </div>
      
      <!-- 展开的标签列表 -->
      <div v-if="showAllTags && commandStore.allTags.length > 20" class="expanded-tags">
        <el-tag
          v-for="tag in commandStore.allTags.slice(20)"
          :key="tag.name"
          :type="selectedTags.includes(tag.name) ? 'primary' : 'info'"
          :effect="selectedTags.includes(tag.name) ? 'dark' : 'plain'"
          @click="toggleTag(tag.name)"
          class="tag-item"
          closable
          @close="removeTag(tag.name)"
        >
          {{ tag.name }} ({{ tag.count }})
        </el-tag>
      </div>
    </div>

    <!-- 命令列表区域 -->
    <div class="command-section">
      <div class="command-header">
        <div class="header-left">
          <h2>{{ headerTitle }}</h2>
          <span class="command-count">{{ displayCommands.length }} 条命令</span>

          <el-tag v-if="searchQuery" type="warning" size="small">
            搜索: {{ searchQuery }}
          </el-tag>
          <el-tag v-if="selectedTags.length > 0" type="info" size="small">
            标签: {{ selectedTags.join(', ') }}
          </el-tag>
        </div>
        <div class="header-right">
          <el-button
            v-if="displayCommands.length > 0"
            type="primary"
            size="small"
            @click="showBatchMigrateModal = true"
            :icon="FolderOpened"
          >
            批量迁移
          </el-button>
        </div>
      </div>

      <div v-if="displayCommands.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">没有找到匹配的命令</div>
        <div class="empty-description">
          <p v-if="searchQuery || selectedTags.length > 0">
            尝试调整搜索条件或标签筛选
          </p>
          <p v-else>
            尝试创建新的命令
          </p>
          <div class="empty-actions">
            <el-button type="primary" @click="handleAddClick">
              <el-icon><Plus /></el-icon>
              新建命令
            </el-button>
            <el-button v-if="searchQuery || selectedTags.length > 0" @click="clearFilters">
              <el-icon><RefreshLeft /></el-icon>
              清除筛选
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="command-list" ref="commandListRef">
        <CommandCard
          v-for="command in displayCommands"
          :key="command.id"
          :command="command"
          @click="handleCommandClick"
          @execute="handleCommandExecute"
          @edit="handleCommandEdit"
          @delete="handleCommandDelete"
          @detail="handleCommandDetail"
          @build="handleCommandBuild"
          @restore="handleCommandRestore"
          @manageCopy="handleManageCopy"
        />
      </div>
    </div>

    <!-- 命令添加模态框 -->
    <CommandAddModal
      v-model="showAddModal"
      :editing-command="editingCommand"
      @saved="handleCommandAdd"
    />

    <!-- 批量新增命令模态框 -->
    <BatchCreateModal
      :visible="showBatchCreateModal"
      @close="showBatchCreateModal = false"
      @confirm="handleBatchCreate"
    />

    <!-- 工作流添加模态框 -->
    <WorkflowAddModal
      v-model:show="showWorkflowModal"
      @confirm="handleWorkflowAdd"
    />

    <!-- 参数输入模态框 -->
    <ParameterModal
      v-if="showParameterModal"
      :command="selectedCommand"
      @confirm="onParameterConfirm"
      @cancel="showParameterModal = false"
    />

    <!-- 删除确认模态框 -->
    <ConfirmModal
      v-if="showDeleteModal"
      :title="deleteConfirmTitle"
      :message="deleteConfirmMessage"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- 批量迁移模态框 -->
    <BatchMigrateModal
      :visible="showBatchMigrateModal"
      :source-category="commandStore.selectedCategory"
      @update:visible="showBatchMigrateModal = $event"
      @migrated="handleMigrated"
    />

    <!-- 命令详情模态框 -->
    <CommandDetailModal
      v-model:visible="showDetailModal"
      :command="detailCommand"
      @edit="handleDetailEdit"
      @execute="handleDetailExecute"
    />

    <!-- 命令构建器模态框 -->
    <CommandBuilderModal
      v-model:visible="showBuilderModal"
      :command="builderCommand"
      @execute="handleBuilderExecute"
      @save="handleBuilderSave"
    />

    <!-- 复制命令管理模态框 -->
    <CopyCommandModal
      v-model="showCopyModal"
      :command="copyCommand"
    />

    <!-- 设置模态框 -->
    <SettingsModal
      v-model="showSettings"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { FolderOpened, Search, Clock, Delete, Plus, DocumentAdd, Tools, Connection, RefreshLeft, Setting, View } from '@element-plus/icons-vue'
import CommandCard from '../components/CommandCard.vue'
import CommandDetailModal from '../components/CommandDetailModal.vue'
import CommandBuilderModal from '../components/CommandBuilderModal.vue'
import CommandAddModal from '../components/CommandAddModal.vue'
import BatchCreateModal from '../components/BatchCreateModal.vue'
import WorkflowAddModal from '../components/WorkflowAddModal.vue'
import ParameterModal from '../components/ParameterModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import BatchMigrateModal from '../components/BatchMigrateModal.vue'
import CopyCommandModal from '../components/CopyCommandModal.vue'
import SettingsModal from '../components/SettingsModal.vue'

import { useCommandStore } from '../stores/command'
import { useKeyboardStore } from '../stores/keyboard'
import { showCopySuccess, showExecuteSuccess, showDeleteSuccess, toast } from '../utils/toast'
import Sortable from 'sortablejs'

const commandStore = useCommandStore()
const keyboardStore = useKeyboardStore()

// 响应式状态
const showParameterModal = ref(false)
const showDeleteModal = ref(false)
const showDetailModal = ref(false)
const showBuilderModal = ref(false)
const showBatchMigrateModal = ref(false)
const showCopyModal = ref(false)
const copyCommand = ref(null)
const showSettings = ref(false)
const showAddModal = ref(false)
const showBatchCreateModal = ref(false)
const showWorkflowModal = ref(false)
const showAllTags = ref(false)

const commandListRef = ref(null)
const searchInput = ref(null)
const selectedCommand = ref(null)
const detailCommand = ref(null)
const builderCommand = ref(null)
const deleteTarget = ref(null)
const editingCommand = ref(null)

// 搜索和筛选状态
const searchQuery = ref('')
const selectedTags = ref([])

// 开发环境标志
const isDev = import.meta.env.DEV

// 计算属性
const headerTitle = computed(() => {
  if (commandStore.selectedCategory === 'recent') {
    return '最近使用的命令'
  }
  if (commandStore.selectedCategory === 'all') {
    return '全部命令'
  }
  if (searchQuery.value || selectedTags.value.length > 0) {
    return '搜索结果'
  }
  
  const category = commandStore.categories.find(cat => cat.id === commandStore.selectedCategory)
  return category ? category.name : '命令列表'
})

// 显示的命令列表（新设计：轻量高效）
const displayCommands = computed(() => {
  // 直接返回过滤后的命令，新的CommandCard设计无需参数升级
  return commandStore.filteredCommands
})

// 搜索功能
const onSearchInput = () => {
  // 同步到store
  commandStore.setSearchQuery(searchQuery.value)
  
  // 添加搜索历史（延迟添加，避免频繁操作）
  if (searchQuery.value.trim()) {
    setTimeout(() => {
      commandStore.setSearchQuery(searchQuery.value)
    }, 1000)
  }
}

const handleSearchEnter = () => {
  if (searchQuery.value.trim() && displayCommands.value.length > 0) {
    // 回车时如果有结果，自动选择第一个
    handleCommandClick(displayCommands.value[0])
  }
}

const selectSearchHistory = (item) => {
  searchQuery.value = item
  onSearchInput()
}

const clearSearchHistory = () => {
  commandStore.searchHistory.splice(0)
  commandStore.saveToStorage()
  toast.success('搜索历史已清除')
}

// 标签功能
const toggleTag = (tagName) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagName)
  }
  // 同步到store
  commandStore.setSelectedTags(selectedTags.value)
}

const removeTag = (tagName) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
    commandStore.setSelectedTags(selectedTags.value)
  }
}

const clearTags = () => {
  selectedTags.value = []
  commandStore.setSelectedTags([])
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedTags.value = []
  commandStore.setSearchQuery('')
  commandStore.setSelectedTags([])
}

// 监听选定分类的变化
watch(() => commandStore.selectedCategory, () => {
  // 当分类改变时，重置搜索和标签筛选（避免循环调用）
  // 只在实际有值的时候才清除，避免不必要的更新
  if (searchQuery.value || selectedTags.value.length > 0) {
    searchQuery.value = ''
    selectedTags.value = []
    commandStore.setSearchQuery('')
    commandStore.setSelectedTags([])
  }
})

// 监听Store中搜索查询的变化
watch(() => commandStore.currentSearchQuery, (newQuery) => {
  searchQuery.value = newQuery
})

// 监听Store中选中标签的变化
watch(() => commandStore.selectedTags, (newTags) => {
  selectedTags.value = [...newTags]
}, { deep: true })

// 按钮点击处理
const handleAddClick = () => {
  if (showAddModal.value) {
    showAddModal.value = false
    editingCommand.value = null
  } else {
    editingCommand.value = null
    showAddModal.value = true
  }
}

const handleBatchClick = () => {
  showBatchCreateModal.value = !showBatchCreateModal.value
}

const handleBuilderClick = () => {
  if (showBuilderModal.value && !builderCommand.value) {
    showBuilderModal.value = false
  } else {
    builderCommand.value = null
    showBuilderModal.value = true
  }
}

const handleWorkflowClick = () => {
  showWorkflowModal.value = !showWorkflowModal.value
}

// 命令操作处理
const handleCommandAdd = (command) => {
  showAddModal.value = false
  editingCommand.value = null
  if (command) {
    toast.success('命令添加成功')
  }
}

const handleBatchCreate = (commands) => {
  try {
    let successCount = 0
    commands.forEach(commandData => {
      commandStore.addCommand(commandData)
      successCount++
    })
    
    showBatchCreateModal.value = false
    toast.success(`批量添加成功: ${successCount} 个命令`)
  } catch (error) {
    console.error('批量创建命令失败:', error)
    toast.error('批量添加失败，请重试')
  }
}

const handleWorkflowAdd = (workflow) => {
  showWorkflowModal.value = false
  // 这里应该调用工作流添加逻辑
  toast.success(`工作流 "${workflow.name}" 已添加`)
}

// 命令操作
const handleCommandClick = (command) => {
  // 点击行复制命令（如果没有参数）
  if (!command.parameters || command.parameters.length === 0) {
    onCopyCommand(command)
  } else {
    // 有参数的命令需要先输入参数
    handleCommandExecute(command)
  }
}

const onCopyCommand = async (command) => {
  try {
    await navigator.clipboard.writeText(command.command)
    commandStore.updateCommandStats(command.id)
    showCopySuccess()
    toast.success(`已复制: ${command.name}`)
  } catch (error) {
    toast.error('复制失败: ' + error.message)
  }
}

const handleCommandExecute = (command) => {
  if (command.parameters && command.parameters.length > 0) {
    selectedCommand.value = command
    showParameterModal.value = true
  } else {
    onCopyCommand(command)
  }
}

const handleCommandEdit = (command) => {
  editingCommand.value = command
  showAddModal.value = true
}

// 删除确认信息
const deleteConfirmTitle = computed(() => {
  if (!deleteTarget.value) return '删除命令'
  
  if (deleteTarget.value.category === 'recycle-bin') {
    return '永久删除命令'
  } else if (deleteTarget.value.isUserCreated) {
    return '删除命令'
  } else {
    return '隐藏命令'
  }
})

const deleteConfirmMessage = computed(() => {
  if (!deleteTarget.value) return ''
  
  const commandName = deleteTarget.value.name
  
  if (deleteTarget.value.category === 'recycle-bin') {
    return `确定要永久删除命令 '${commandName}' 吗？此操作不可撤销！`
  } else if (deleteTarget.value.isUserCreated) {
    return `确定要删除命令 '${commandName}' 吗？删除后将移至回收站，可在30天内恢复。`
  } else {
    return `确定要隐藏示例命令 '${commandName}' 吗？隐藏后将不再显示。`
  }
})

const handleCommandDelete = (command) => {
  deleteTarget.value = command
  showDeleteModal.value = true
}

const handleCommandDetail = (command) => {
  detailCommand.value = command
  showDetailModal.value = true
}

const handleCommandBuild = (command) => {
  builderCommand.value = command
  showBuilderModal.value = true
}

const handleCommandRestore = (command) => {
  try {
    commandStore.restoreCommand(command.id)
    toast.success('命令已恢复')
  } catch (error) {
    console.error('恢复命令失败:', error)
    toast.error('恢复失败，请重试')
  }
}

// 处理管理复制命令
const handleManageCopy = (command) => {
  copyCommand.value = command
  showCopyModal.value = true
}

// 处理设置
const handleOpenSettings = () => {
  showSettings.value = true
}

// 详情模态框事件处理
const handleDetailEdit = (command) => {
  editingCommand.value = command
  showAddModal.value = true
  showDetailModal.value = false
}

const handleDetailExecute = (command) => {
  showDetailModal.value = false
  handleCommandExecute(command)
}

// 构建器模态框事件处理
const handleBuilderExecute = async (data) => {
  try {
    // 使用增强的构建功能
    const result = await commandStore.buildEnhancedCommand(data.original, {
      mode: 'executable',
      validateRequired: true
    })
    
    if (result.success) {
      showExecuteSuccess()
    } else {
      toast.error('命令构建失败: ' + (result.errors?.[0]?.message || '未知错误'))
    }
  } catch (error) {
    toast.error('执行失败: ' + error.message)
  }
  showBuilderModal.value = false
}

const handleBuilderSave = async (commandData) => {
  try {
    const result = await commandStore.createEnhancedCommand(commandData)
    
    if (result.success) {
      toast.success(`命令 "${result.command.name}" 已保存`)
    } else {
      toast.error('保存失败: ' + (result.errors?.[0]?.message || '未知错误'))
    }
  } catch (error) {
    toast.error('保存失败: ' + error.message)
  }
  showBuilderModal.value = false
}

// 参数模态框
const onParameterConfirm = async (parameters) => {
  if (selectedCommand.value) {
    // 这里应该执行带参数的命令
    commandStore.updateCommandStats(selectedCommand.value.id)
    showExecuteSuccess()
    toast.success(`已执行: ${selectedCommand.value.name}`)
  }
  showParameterModal.value = false
  selectedCommand.value = null
}

// 删除确认
const confirmDelete = () => {
  if (deleteTarget.value) {
    const commandName = deleteTarget.value.name
    const isFromRecycleBin = deleteTarget.value.category === 'recycle-bin'
    
    if (isFromRecycleBin) {
      commandStore.permanentDeleteCommand(deleteTarget.value.id)
      toast.success(`命令 '${commandName}' 已永久删除`)
    } else {
      commandStore.deleteCommand(deleteTarget.value.id)
      if (deleteTarget.value.isUserCreated) {
        toast.success(`命令 '${commandName}' 已移至回收站`)
      } else {
        toast.success(`示例命令 '${commandName}' 已隐藏`)
      }
    }
  }
  showDeleteModal.value = false
  deleteTarget.value = null
}

// 处理批量迁移完成
const handleMigrated = (result) => {
  const targetCategoryName = commandStore.categories.find(cat => cat.id === result.targetCategory)?.name || '未知分类'
  toast.success(`成功迁移 ${result.count} 个命令到 ${targetCategoryName}`)
}

// 全局事件监听
const handleFocusSearch = () => {
  if (searchInput.value) {
    searchInput.value.focus()
  }
}

const handleNewCommand = () => {
  handleAddClick()
}

const handleOpenBuilder = () => {
  handleBuilderClick()
}

// 初始化拖拽排序
const initSortable = () => {
  if (!commandListRef.value) return
  
  new Sortable(commandListRef.value, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    handle: '.command-drag-handle',
    onEnd: (evt) => {
      const items = Array.from(evt.target.children).map(el => el.getAttribute('data-command-id'))
      commandStore.updateSortOrder('commands', items)
    }
  })
}

// 监听编辑命令变化
watch(() => commandStore.editingCommand, (newCommand) => {
  if (newCommand) {
    editingCommand.value = newCommand
    showAddModal.value = true
  }
})

// 在组件挂载后初始化
onMounted(() => {
  // 初始化快捷键
  keyboardStore.initShortcuts()
  
  // 同步Store中的搜索和标签状态到本地
  searchQuery.value = commandStore.currentSearchQuery
  selectedTags.value = [...commandStore.selectedTags]
  

  
  // 注册全局事件监听器
  window.addEventListener('focus-search', handleFocusSearch)
  window.addEventListener('new-command', handleNewCommand)
  window.addEventListener('open-builder', handleOpenBuilder)
  
  nextTick(() => {
    initSortable()
  })
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('focus-search', handleFocusSearch)
  window.removeEventListener('new-command', handleNewCommand)
  window.removeEventListener('open-builder', handleOpenBuilder)
})
</script>

<style lang="scss" scoped>
.home {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.top-search-section {
  display: flex;
  align-items: center;
  gap: var(--el-spacing-md);
  padding: var(--el-spacing-md);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
  z-index: 1000;
  
  .search-bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 500px;
    
    .search-input {
      flex: 1;
    }
    
    .search-history-btn {
      padding: 8px;
      min-width: auto;
    }
  }
  
  .action-buttons {
    display: flex;
    gap: var(--el-spacing-sm);
    flex-wrap: wrap;
    align-items: center;
  }
  
  .settings-wrapper {
    margin-left: auto;
    padding-left: 16px;
  }
  
  .settings-btn {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--el-color-primary-light-5);
  }
  
  .settings-btn:hover {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

.tag-section {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-extra-light);
  padding: var(--el-spacing-sm) var(--el-spacing-md);
  
  .tag-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
  
  .tag-list, .expanded-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    
    .tag-item {
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-1px);
      }
    }
  }
  
  .expanded-tags {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-extra-light);
  }
}

.command-section {
  flex: 1;
  min-width: 0;
  padding: var(--el-spacing-lg);
  overflow-y: auto;
  
  .command-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--el-spacing-lg);
    
    .header-left {
      display: flex;
      align-items: center;
      gap: var(--el-spacing-md);
      flex-wrap: wrap;
      
      h2 {
        margin: 0;
        font-size: var(--el-font-size-xl);
        color: var(--el-text-color-primary);
      }
      
      .command-count {
        font-size: var(--el-font-size-small);
        color: var(--el-text-color-secondary);
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: var(--el-spacing-sm);
    }
  }
  
  .command-list {
    display: flex;
    flex-direction: column;
    gap: var(--el-spacing-md);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--el-spacing-xl);
  text-align: center;
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: var(--el-spacing-lg);
  }
  
  .empty-title {
    font-size: var(--el-font-size-large);
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: var(--el-spacing-md);
  }
  
  .empty-description {
    color: var(--el-text-color-secondary);
    margin-bottom: var(--el-spacing-lg);
  }
  
  .empty-actions {
    display: flex;
    gap: var(--el-spacing-sm);
    justify-content: center;
    flex-wrap: wrap;
  }
}

// 拖拽相关样式
:deep(.sortable-ghost) {
  opacity: 0.5;
  background: var(--el-color-primary-light-9) !important;
  border: 1px dashed var(--el-color-primary) !important;
}

:deep(.sortable-drag) {
  background: var(--el-bg-color) !important;
  box-shadow: var(--el-box-shadow-light);
  cursor: move !important;
  opacity: 0.9;
}

// 响应式设计
@media (max-width: 768px) {
  .top-search-section {
    flex-direction: column;
    align-items: stretch;
    
    .search-bar {
      max-width: none;
    }
    
    .action-buttons {
      justify-content: center;
    }
  }
  
  .tag-section .tag-list {
    justify-content: center;
  }
}
</style> 