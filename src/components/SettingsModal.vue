<template>
  <el-dialog
    v-model="visible"
    title="应用设置"
    width="600px"
    :before-close="handleClose"
  >
    <div class="settings-container">
      <!-- 设置分类菜单 -->
      <div class="settings-menu">
        <div 
          v-for="category in settingsCategories" 
          :key="category.key"
          class="menu-item"
          :class="{ 'active': activeCategory === category.key }"
          @click="activeCategory = category.key"
        >
          <el-icon>
            <component :is="category.icon" />
          </el-icon>
          {{ category.name }}
        </div>
      </div>

      <!-- 设置内容区域 -->
      <div class="settings-content">
        <!-- 命令卡片设置 -->
        <div v-if="activeCategory === 'command-card'" class="setting-section">
          <!-- 子分类选择 -->
          <div class="sub-categories">
            <div 
              v-for="subCategory in commandCardSubCategories" 
              :key="subCategory.key"
              class="sub-menu-item"
              :class="{ 'active': activeSubCategory === subCategory.key }"
              @click="activeSubCategory = subCategory.key"
            >
              <el-icon>
                <component :is="subCategory.icon" />
              </el-icon>
              {{ subCategory.name }}
            </div>
          </div>

          <!-- 显示设置内容 -->
          <div v-if="activeSubCategory === 'display'" class="sub-setting-content">
          <h3>命令卡片显示设置</h3>
          <div class="setting-group">
            <h4>基本信息显示</h4>
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.showCommandName"
                active-text="显示命令名称"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">显示命令的名称和自定义标签</p>
            </div>
            
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.showDescription"
                active-text="显示命令描述"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">显示命令的功能描述</p>
            </div>
          </div>

          <div class="setting-group">
            <h4>扩展信息显示</h4>
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.showCategory"
                active-text="显示分类标签"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">显示命令所属的分类</p>
            </div>
            
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.showTags"
                active-text="显示命令标签"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">显示命令的标签列表</p>
            </div>
            
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.showUsageStats"
                active-text="显示使用统计"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">显示命令的使用次数和频率</p>
            </div>
            
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.showParameters"
                active-text="显示参数信息"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">显示命令包含的参数数量</p>
            </div>
          </div>

          <div class="setting-group">
            <h4>显示模式</h4>
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.compactMode"
                active-text="紧凑模式"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">使用更紧凑的布局和更小的字体</p>
            </div>
          </div>

          <div class="setting-group">
            <h4>浏览模式</h4>
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.enableInfiniteScroll"
                active-text="无限滚动模式（推荐）"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">默认模式：滚动到底部时自动加载更多内容，支持连续浏览所有命令</p>
            </div>
            
            <div class="setting-item">
              <el-switch
                v-model="localDisplaySettings.enablePagination"
                active-text="显示传统分页器"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">可选：在命令列表底部显示分页导航器，适合习惯传统分页的用户</p>
            </div>
            
            <div class="setting-item" v-if="localDisplaySettings.enablePagination">
              <el-switch
                v-model="localDisplaySettings.stickyPagination"
                active-text="滚动时固定分页器"
                @change="updateDisplaySettings"
              />
              <p class="setting-desc">滚动页面时在屏幕底部显示固定的快捷分页器</p>
            </div>
            
            <div class="browse-mode-tip">
              <el-alert
                :title="`当前浏览模式：${getBrowseModeText()}`"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
          </div>

          <div class="preset-section">
            <h4>快速预设</h4>
            <div class="preset-buttons">
              <el-button @click="applyDisplayPreset('minimal')" size="small">
                极简模式
              </el-button>
              <el-button @click="applyDisplayPreset('standard')" size="small" type="primary">
                标准模式
              </el-button>
              <el-button @click="applyDisplayPreset('detailed')" size="small">
                详细模式
              </el-button>
            </div>
          </div>

                     <div class="section-actions">
             <el-button @click="resetDisplayToDefault">重置默认</el-button>
           </div>
           </div>

           <!-- 行为设置内容 -->
           <div v-else-if="activeSubCategory === 'behavior'" class="sub-setting-content">
             <h3>命令卡片行为设置</h3>
             <div class="setting-group">
               <h4>交互行为</h4>
               <div class="setting-item">
                 <el-switch
                   v-model="behaviorSettings.doubleClickToBuild"
                   active-text="双击进入构建器"
                   @change="updateBehaviorSettings"
                 />
                 <p class="setting-desc">双击命令卡片时进入智能构建器</p>
               </div>
               
               <div class="setting-item">
                 <el-switch
                   v-model="behaviorSettings.singleClickToCopy"
                   active-text="单击复制命令"
                   @change="updateBehaviorSettings"
                 />
                 <p class="setting-desc">单击命令卡片时复制默认命令</p>
               </div>
             </div>
           </div>

           <!-- 布局设置内容 -->
           <div v-else-if="activeSubCategory === 'layout'" class="sub-setting-content">
             <h3>命令卡片布局设置</h3>
             <div class="setting-group">
               <h4>卡片样式</h4>
               <div class="setting-item">
                 <el-radio-group v-model="layoutSettings.cardStyle" @change="updateLayoutSettings">
                   <el-radio label="default">默认样式</el-radio>
                   <el-radio label="minimal">极简样式</el-radio>
                   <el-radio label="detailed">详细样式</el-radio>
                 </el-radio-group>
                 <p class="setting-desc">选择命令卡片的整体视觉风格</p>
               </div>
             </div>
           </div>
         </div>

        <!-- 其他设置 -->
        <div v-else-if="activeCategory === 'general'" class="setting-section">
          <h3>通用设置</h3>
          <div class="setting-group">
            <h4>界面设置</h4>
            <div class="setting-item">
              <el-switch
                v-model="generalSettings.darkMode"
                active-text="深色模式"
                @change="updateGeneralSettings"
              />
              <p class="setting-desc">使用深色主题界面</p>
            </div>
            
            <div class="setting-item">
              <el-switch
                v-model="generalSettings.autoSave"
                active-text="自动保存"
                @change="updateGeneralSettings"
              />
              <p class="setting-desc">自动保存用户操作和设置</p>
            </div>
          </div>

          <div class="setting-group">
            <h4>数据管理</h4>
            <div class="setting-item">
              <el-input-number
                v-model="generalSettings.searchHistoryLimit"
                :min="5"
                :max="50"
                size="small"
                @change="updateGeneralSettings"
              />
              <label>搜索历史保留条数</label>
              <p class="setting-desc">限制保存的搜索历史记录数量</p>
            </div>
          </div>
        </div>

        <!-- 其他分类可以继续添加 -->
        <div v-else class="setting-section">
          <div class="coming-soon">
            <el-icon size="48"><Setting /></el-icon>
            <h3>更多设置正在开发中...</h3>
            <p>敬请期待更多个性化设置选项</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommandStore } from '../stores/command'
import { ElMessage } from 'element-plus'
import { 
  View, 
  Setting, 
  Tools,
  Grid
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Store
const commandStore = useCommandStore()

// Reactive data
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeCategory = ref('command-card')
const activeSubCategory = ref('display')

// 设置分类
const settingsCategories = [
  { key: 'command-card', name: '命令卡片', icon: Grid },
  { key: 'general', name: '通用设置', icon: Setting },
  { key: 'advanced', name: '高级设置', icon: Tools }
]

// 命令卡片子分类
const commandCardSubCategories = [
  { key: 'display', name: '显示设置', icon: View },
  { key: 'behavior', name: '行为设置', icon: Tools },
  { key: 'layout', name: '布局设置', icon: Setting }
]

// 本地设置副本
const localDisplaySettings = ref({})
const behaviorSettings = ref({
  doubleClickToBuild: true,
  singleClickToCopy: true
})
const layoutSettings = ref({
  cardStyle: 'default'
})
const generalSettings = ref({
  darkMode: false,
  autoSave: true,
  searchHistoryLimit: 20
})

// 初始化设置
const initializeSettings = () => {
  localDisplaySettings.value = { ...commandStore.getDisplaySettings() }
}

// 监听模态框显示
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeSettings()
  }
}, { immediate: true })

// 更新显示设置
const updateDisplaySettings = () => {
  commandStore.updateDisplaySettings(localDisplaySettings.value)
}

// 获取当前浏览模式的描述文本
const getBrowseModeText = () => {
  const infinite = localDisplaySettings.value.enableInfiniteScroll
  const pagination = localDisplaySettings.value.enablePagination
  const sticky = localDisplaySettings.value.stickyPagination
  
  if (infinite && pagination && sticky) {
    return '增强模式（无限滚动 + 传统分页器 + 固定分页器）'
  } else if (infinite && pagination) {
    return '混合模式（无限滚动 + 传统分页器）'
  } else if (infinite) {
    return '无限滚动模式（默认推荐）'
  } else if (pagination && sticky) {
    return '传统分页模式（含固定分页器）'
  } else if (pagination) {
    return '传统分页模式'
  } else {
    return '静态显示模式（无浏览功能）'
  }
}

// 更新行为设置
const updateBehaviorSettings = () => {
  // 这里可以添加行为设置的保存逻辑
  console.log('更新行为设置:', behaviorSettings.value)
}

// 更新布局设置
const updateLayoutSettings = () => {
  // 这里可以添加布局设置的保存逻辑
  console.log('更新布局设置:', layoutSettings.value)
}

// 更新通用设置
const updateGeneralSettings = () => {
  // 这里可以添加通用设置的保存逻辑
  console.log('更新通用设置:', generalSettings.value)
}

// 应用显示预设
const applyDisplayPreset = (preset) => {
  switch (preset) {
    case 'minimal':
      localDisplaySettings.value = {
        showCommandName: false,
        showDescription: false,
        showCategory: false,
        showTags: false,
        showUsageStats: false,
        showParameters: false,
        compactMode: true
      }
      break
    case 'standard':
      localDisplaySettings.value = {
        showCommandName: true,
        showDescription: true,
        showCategory: false,
        showTags: false,
        showUsageStats: false,
        showParameters: false,
        compactMode: false
      }
      break
    case 'detailed':
      localDisplaySettings.value = {
        showCommandName: true,
        showDescription: true,
        showCategory: true,
        showTags: true,
        showUsageStats: true,
        showParameters: true,
        compactMode: false
      }
      break
  }
  updateDisplaySettings()
  ElMessage.success(`已应用${preset === 'minimal' ? '极简' : preset === 'standard' ? '标准' : '详细'}模式`)
}

// 重置显示设置为默认
const resetDisplayToDefault = () => {
  localDisplaySettings.value = {
    showCommandName: true,
    showDescription: true,
    showCategory: false,
    showTags: false,
    showUsageStats: false,
    showParameters: false,
    compactMode: false
  }
  updateDisplaySettings()
  ElMessage.success('已重置为默认设置')
}

// 关闭处理
const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.settings-container {
  display: flex;
  min-height: 400px;
}

.settings-menu {
  width: 160px;
  border-right: 1px solid var(--el-border-color-light);
  padding-right: 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.menu-item:hover {
  background-color: var(--el-fill-color-light);
}

.menu-item.active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.settings-content {
  flex: 1;
  padding-left: 24px;
}

.sub-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sub-menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: var(--el-text-color-regular);
  border: 1px solid var(--el-border-color-lighter);
}

.sub-menu-item:hover {
  background-color: var(--el-fill-color-light);
  border-color: var(--el-color-primary-light-7);
}

.sub-menu-item.active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
  border-color: var(--el-color-primary-light-5);
}

.sub-setting-content {
  /* 子设置内容样式 */
}

.setting-section h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.setting-group {
  margin-bottom: 32px;
}

.setting-group h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 8px;
}

.setting-item {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: border-color 0.2s ease;
}

.setting-item:hover {
  border-color: var(--el-color-primary-light-7);
}

.setting-item label {
  margin-left: 8px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.setting-desc {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.browse-mode-tip {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
}

.browse-mode-tip .el-alert {
  --el-alert-padding: 8px 12px;
  --el-alert-border-radius: 4px;
}

.preset-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.preset-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.preset-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.section-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.coming-soon {
  text-align: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
}

.coming-soon h3 {
  margin: 16px 0 8px 0;
  color: var(--el-text-color-regular);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 