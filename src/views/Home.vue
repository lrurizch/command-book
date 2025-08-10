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
          {{ showAddModal ? '取消新建' : '新建命令模板' }}
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
          <div class="header-stats">
            <span class="command-count">{{ totalCommands }} 条命令</span>
          </div>
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
              新建命令模板
            </el-button>
            <el-button v-if="searchQuery || selectedTags.length > 0" @click="clearFilters">
              <el-icon><RefreshLeft /></el-icon>
              清除筛选
            </el-button>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="command-list" ref="commandListRef">
          <!-- 命令卡片列表 -->
        <CommandCard
            v-for="(command, index) in displayCommands"
          :key="command.id"
            :ref="el => setCommandCardRef(el, index)"
          :command="command"
          @click="handleCommandClick"
          @copy="onCopyCommand"
          @execute="handleCommandExecute"
          @edit="handleCommandEdit"
          @delete="handleCommandDelete"
          @detail="handleCommandDetail"
          @build="handleCommandBuild"
          @restore="handleCommandRestore"
          @duplicate="handleCommandDuplicate"
          @showCommonCommands="handleShowCommonCommands"
            @manageCopy="handleManageCopy"
          />
        </div>
        
        <!-- 常规分页器 -->
        <div v-if="commandStore.displaySettings.enablePagination" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="pageSizes"
            :total="totalCommands"
            :background="true"
            :disabled="isPageChanging"
            layout="total, sizes, prev, pager, next, jumper"
            class="command-pagination"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
        />
        </div>
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

    <!-- 命令构建器模态框已删除，使用 CommandAddModal 的模板构建器模式 -->

    <!-- 复制命令管理模态框 -->
    <CopyCommandModal
      v-model="showCopyModal"
      :command="copyCommand"
    />

    <!-- 设置模态框 -->
    <SettingsModal
      v-model="showSettings"
    />

    <!-- 常用完整命令模态框 -->
    <CommonCommandsModal
      v-if="commonCommandsCommand"
      v-model:show="showCommonCommandsModal"
      :command="commonCommandsCommand"
      @commandCopied="handleCommandCopied"
    />
    
    <!-- 固定分页器 -->
    <Transition name="sticky-pagination">
      <div v-if="showStickyPagination" class="sticky-pagination-container">
        <div class="sticky-pagination-content">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="pageSizes"
            :total="totalCommands"
            :background="true"
            :disabled="isPageChanging"
            layout="prev, pager, next"
            class="sticky-pagination"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
          
          <!-- 分页信息 -->
          <div class="sticky-pagination-info">
            第 {{ currentPage }} 页 / 共 {{ Math.ceil(totalCommands / pageSize) }} 页
          </div>
          
          <!-- 关闭按钮 -->
          <el-button 
            size="small" 
            type="text" 
            @click="commandStore.updateDisplaySettings({ stickyPagination: false })"
            class="sticky-pagination-close"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { FolderOpened, Search, Clock, Delete, Plus, DocumentAdd, Tools, Connection, RefreshLeft, Setting, View, Loading, Check, Close } from '@element-plus/icons-vue'
import CommandCard from '../components/CommandCard.vue'
import CommandDetailModal from '../components/CommandDetailModal.vue'
// CommandBuilderModal 已被删除，使用 CommandAddModal 的模板构建器模式
import CommandAddModal from '../components/CommandAddModal.vue'
import BatchCreateModal from '../components/BatchCreateModal.vue'
import WorkflowAddModal from '../components/WorkflowAddModal.vue'
import ParameterModal from '../components/ParameterModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import BatchMigrateModal from '../components/BatchMigrateModal.vue'
import CopyCommandModal from '../components/CopyCommandModal.vue'
import CommonCommandsModal from '../components/CommonCommandsModal.vue'
import SettingsModal from '../components/SettingsModal.vue'

import { useCommandStore } from '../stores/command'
import { useKeyboardStore } from '../stores/keyboard'
import { showCopySuccess, showExecuteSuccess, showDeleteSuccess, toast } from '../utils/toast'
import Sortable from 'sortablejs'

const commandStore = useCommandStore()
const keyboardStore = useKeyboardStore()

// 基础配置
const VIRTUAL_SCROLL_THRESHOLD = 100 // 超过100条命令启用虚拟滚动
const VIRTUAL_ITEM_HEIGHT = 120 // 每个命令卡片的高度（px）
const VIRTUAL_VISIBLE_COUNT = 15 // 可见区域显示的命令数量

// 虚拟滚动状态
const virtualScrollEnabled = ref(false)
const virtualScrollTop = ref(0)
const virtualVisibleCommands = ref([])
const virtualStartIndex = ref(0)
const virtualEndIndex = ref(VIRTUAL_VISIBLE_COUNT)

// 组件状态
const infiniteScrollCommands = ref([])
const commandCardRefs = ref(new Map())
const commandListRef = ref(null)
const searchInput = ref(null)
const selectedCommand = ref(null)
const detailCommand = ref(null)
const builderCommand = ref(null)
const deleteTarget = ref(null)
const editingCommand = ref(null)
const commonCommandsCommand = ref(null)

// 监听变量（用于检测变化）
let lastCategory = null
let lastQuery = null
let lastTagsStr = null

// 模态框状态
const showParameterModal = ref(false)
const showDeleteModal = ref(false)
const showDetailModal = ref(false)
const showBuilderModal = ref(false)
const showBatchMigrateModal = ref(false)
const showCopyModal = ref(false)
const showSettings = ref(false)
const showAddModal = ref(false)
const showBatchCreateModal = ref(false)
const showWorkflowModal = ref(false)
const showCommonCommandsModal = ref(false)
const showAllTags = ref(false)

// 搜索和筛选状态
const searchQuery = ref('')
const selectedTags = ref([])

// 分页状态
const currentPage = ref(1)
const pageSize = ref(15)
const pageSizes = [10, 15, 20, 30, 50, 100]
const isPageChanging = ref(false)

// 显示的命令列表（优化版本）
const displayCommands = computed(() => {
  if (virtualScrollEnabled.value && virtualVisibleCommands.value.length > 0) {
    return virtualVisibleCommands.value
  }
  
  if (commandStore.displaySettings.enableInfiniteScroll) {
    if (infiniteScrollCommands.value.length > 0) {
      return infiniteScrollCommands.value
    }
  }
  
  const allCommands = commandStore.getCommandsFromIndex(
    commandStore.selectedCategory,
    commandStore.currentSearchQuery,
    commandStore.selectedTags
  ) || []
  
  // 根据数据量决定是否启用虚拟滚动
  const shouldUseVirtualScroll = allCommands.length > VIRTUAL_SCROLL_THRESHOLD
  virtualScrollEnabled.value = shouldUseVirtualScroll
  
  if (shouldUseVirtualScroll) {
    virtualStartIndex.value = 0
    virtualEndIndex.value = Math.min(VIRTUAL_VISIBLE_COUNT, allCommands.length)
    virtualVisibleCommands.value = allCommands.slice(virtualStartIndex.value, virtualEndIndex.value)
    return virtualVisibleCommands.value
  }
  
  return allCommands
})

// 虚拟滚动处理
const handleVirtualScroll = () => {
  if (!virtualScrollEnabled.value) return
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const newStartIndex = Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT)
  const newEndIndex = Math.min(
    newStartIndex + VIRTUAL_VISIBLE_COUNT,
    commandStore.getCommandsFromIndex(
      commandStore.selectedCategory,
      commandStore.currentSearchQuery,
      commandStore.selectedTags
    )?.length || 0
  )
  
  if (newStartIndex !== virtualStartIndex.value) {
    virtualStartIndex.value = newStartIndex
    virtualEndIndex.value = newEndIndex
    virtualVisibleCommands.value = commandStore.getCommandsFromIndex(
      commandStore.selectedCategory,
      commandStore.currentSearchQuery,
      commandStore.selectedTags
    )?.slice(newStartIndex, newEndIndex) || []
    virtualScrollTop.value = scrollTop
  }
}

// 命令卡片引用管理
const setCommandCardRef = (el, index) => {
  if (el) {
    commandCardRefs.value.set(index, el)
  } else {
    commandCardRefs.value.delete(index)
  }
}

// 聚焦到第一个命令卡片
const focusFirstCommand = () => {
  if (displayCommands.value.length === 0) return
  
  nextTick(() => {
    const firstCard = commandCardRefs.value.get(0)
    if (firstCard && firstCard.$el) {
      firstCard.$el.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
      
      firstCard.$el.classList.add('focused')
      setTimeout(() => {
        if (firstCard.$el) {
          firstCard.$el.classList.remove('focused')
        }
      }, 2000)
    } else {
      const commandList = commandListRef.value
      if (commandList) {
        commandList.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
      }
    }
  })
}

// 分页器事件处理
const handlePageChange = async (page) => {
  if (isPageChanging.value) return
  
  isPageChanging.value = true
  currentPage.value = page
  
  // 如果不是无限滚动模式，聚焦到第一个命令
  if (!commandStore.displaySettings.enableInfiniteScroll) {
    focusFirstCommand()
  }
  
  nextTick(() => {
    isPageChanging.value = false
  })
}

const handlePageSizeChange = async (size) => {
  if (isPageChanging.value) return
  
  isPageChanging.value = true
  pageSize.value = size
  currentPage.value = 1
  
  // 如果不是无限滚动模式，聚焦到第一个命令
  if (!commandStore.displaySettings.enableInfiniteScroll) {
    focusFirstCommand()
  }
  
  nextTick(() => {
    isPageChanging.value = false
  })
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('scroll', handleVirtualScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleVirtualScroll)
})

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

// 全部过滤后的命令（用于总数计算）
const allFilteredCommands = computed(() => {
  // 直接使用全局索引或store的filteredCommands
  if (commandStore.globalCategoryIndex.size > 0) {
    return commandStore.getCommandsFromIndex(
      commandStore.selectedCategory,
      commandStore.currentSearchQuery,
      commandStore.selectedTags
    ) || []
  }
  return commandStore.filteredCommands || []
})

// 总数量（用于分页器）
const totalCommands = computed(() => allFilteredCommands.value.length)

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
    if (!command) {
      toast.error('无效的命令')
      return
    }

    let textToCopy = ''
    let commandName = ''

    if (typeof command === 'string') {
      // 直接复制命令文本
      textToCopy = command
    } else if (command.command) {
      // 从命令对象中获取命令文本
      textToCopy = commandStore.getDefaultCopyCommand(command.id) || command.command
      commandName = command.name
      
      console.log('复制命令:', commandName, '内容:', textToCopy)
      
      // 更新命令使用统计
      commandStore.updateCommandStats(command.id)
      
      // 如果复制的是常用完整命令，更新常用命令的使用统计
      if (textToCopy && textToCopy !== command.command) {
        commandStore.updateCommonCommandUsage(command.id, textToCopy)
      }
    } else {
      toast.error('无效的命令')
      return
    }

    if (!textToCopy) {
      toast.error('命令内容为空')
      return
    }

    await navigator.clipboard.writeText(textToCopy)
    showCopySuccess()
    toast.success(commandName ? `已复制: ${commandName}` : '命令已复制')
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

const handleCommandDuplicate = (command) => {
  const duplicatedCommand = {
    ...command,
    id: commandStore.generateId(),
    name: `${command.name} (副本)`,
    isUserCreated: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
    lastUsed: null
  }
  
  commandStore.addCommand(duplicatedCommand)
  toast.success(`命令 "${command.name}" 已复制为新命令`)
}

const handleShowCommonCommands = (command) => {
  console.log('显示常用命令弹窗:', command.name)
  commonCommandsCommand.value = command
  showCommonCommandsModal.value = true
}

const handleCommandCopied = (commandText) => {
  // 更新命令使用统计
  if (commonCommandsCommand.value) {
    commandStore.updateCommandStats(commonCommandsCommand.value.id)
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
onMounted(async () => {
  // 调试：检查store状态
  console.log('Home.vue mounted - Store状态检查:', {
    totalCommands: commandStore.commands.length,
    filteredCommands: commandStore.filteredCommands.length,
    selectedCategory: commandStore.selectedCategory,
    globalIndexSize: commandStore.globalCategoryIndex.size,
    indexMetadata: commandStore.indexMetadata,
    displaySettings: commandStore.displaySettings
  })
  
  // 初始化快捷键
  keyboardStore.initShortcuts()
  
  // 同步Store中的搜索和标签状态到本地
  searchQuery.value = commandStore.currentSearchQuery
  selectedTags.value = [...commandStore.selectedTags]
  
  // 初始化监听变量
  lastCategory = commandStore.selectedCategory
  lastQuery = commandStore.currentSearchQuery
  lastTagsStr = commandStore.selectedTags.join(',')
  
  // 确保命令数据已加载
  console.log('当前命令数量:', commandStore.commands.length)
  
  // 注册全局事件监听器
  window.addEventListener('focus-search', handleFocusSearch)
  window.addEventListener('new-command', handleNewCommand)
  window.addEventListener('open-builder', handleOpenBuilder)
  
  // 注册滚动监听器
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('scroll', handleInfiniteScroll, { passive: true })
  
  nextTick(() => {
    initSortable()
  })
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('focus-search', handleFocusSearch)
  window.removeEventListener('new-command', handleNewCommand)
  window.removeEventListener('open-builder', handleOpenBuilder)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('scroll', handleInfiniteScroll)
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
      
      h2 {
        margin: 0;
        font-size: var(--el-font-size-xl);
        color: var(--el-text-color-primary);
      }
      
      .header-stats {
        display: flex;
        align-items: center;
        gap: var(--el-spacing-sm);
      
      .command-count {
        font-size: var(--el-font-size-small);
        color: var(--el-text-color-secondary);
        }
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
    
    // 命令卡片聚焦效果
    :deep(.command-card.focused) {
      animation: focusHighlight 2s ease-in-out;
      transform: scale(1.02);
      box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
      border: 2px solid var(--el-color-primary);
      z-index: 10;
      position: relative;
    }
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
  
  .pagination-container {
    margin-top: var(--el-spacing-md);
  }
}

// 分页器样式
.pagination-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: var(--el-spacing-lg);
  padding: var(--el-spacing-lg) 0;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}

.pagination-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
  color: var(--el-color-primary);
  font-size: 14px;
  z-index: 10;
}

.progressive-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-success);
  font-size: 14px;
  margin-top: 16px;
  justify-content: center;
  padding: 12px;
  background: var(--el-color-success-light-9);
  border-radius: 6px;
  border: 1px solid var(--el-color-success-light-7);
}

// 后台加载指示器
.background-loading {
  display: flex;
  justify-content: center;
  padding: var(--el-spacing-md) 0;
  margin-top: var(--el-spacing-md);
  border-top: 1px dashed var(--el-border-color-light);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  
  .el-icon {
    color: var(--el-color-primary);
  }
}

.command-pagination {
  :deep(.el-pagination) {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-sm);
  }
  
  :deep(.el-pagination__total) {
    color: var(--el-text-color-regular);
    font-weight: 500;
  }
  
  :deep(.el-pagination__sizes) {
    .el-select {
      .el-input__wrapper {
        width: 85px;
        border-radius: 6px;
      }
    }
  }
  
  :deep(.el-pager) {
    li {
      min-width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid var(--el-border-color-lighter);
      background: var(--el-bg-color);
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-5);
      }
      
      &.is-active {
        background: var(--el-color-primary);
        border-color: var(--el-color-primary);
        color: white;
        font-weight: 600;
      }
    }
  }
  
  :deep(.btn-prev),
  :deep(.btn-next) {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary);
    }
    
    &:disabled {
      background: var(--el-fill-color-light);
      border-color: var(--el-border-color-lighter);
      color: var(--el-text-color-disabled);
      cursor: not-allowed;
    }
  }
  
  :deep(.el-pagination__jump) {
    .el-input {
      width: 60px;
      
      .el-input__wrapper {
        border-radius: 6px;
      }
    }
  }
}

// 无限滚动相关样式
.infinite-scroll-loading,
.infinite-scroll-end {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--el-spacing-lg);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  gap: 8px;
}

.infinite-scroll-end {
  border-top: 1px dashed var(--el-border-color-light);
  color: var(--el-text-color-placeholder);
}

// 固定分页器样式
.sticky-pagination-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
}

.sticky-pagination-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--el-spacing-md);
  padding: var(--el-spacing-md) var(--el-spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.sticky-pagination {
  :deep(.el-pagination) {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-sm);
  }
  
  :deep(.el-pager) {
    li {
      min-width: 28px;
      height: 28px;
      border-radius: 4px;
    }
  }
  
  :deep(.btn-prev),
  :deep(.btn-next) {
    width: 28px;
    height: 28px;
    border-radius: 4px;
  }
}

.sticky-pagination-info {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.sticky-pagination-close {
  margin-left: auto;
  color: var(--el-text-color-secondary);
  
  &:hover {
    color: var(--el-text-color-primary);
  }
}

// 固定分页器动画
.sticky-pagination-enter-active,
.sticky-pagination-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.sticky-pagination-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.sticky-pagination-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

// 聚焦高亮动画
@keyframes focusHighlight {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: var(--el-border-color);
  }
  20% {
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
    border-color: var(--el-color-primary);
  }
  80% {
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
    border-color: var(--el-color-primary);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: var(--el-border-color);
  }
}
</style> 