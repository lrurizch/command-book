<template>
  <div class="category-tree">
    <div class="category-header">
      <span class="category-title">分类</span>
      <div class="category-controls">
        <button 
          class="control-btn toggle-expand-btn" 
          @click="toggleAllCategories"
          :title="hasExpandedCategories ? '全部收回' : '全部展开'"
        >
          {{ hasExpandedCategories ? '⊟' : '⊞' }}
        </button>
        <button 
          class="add-category-btn" 
          @click="addTopLevelCategory"
          :title="inlineEditingCategory === 'new-top-level-category' ? '取消新增' : '新增一级分类'"
        >
          <span class="add-icon">{{ inlineEditingCategory === 'new-top-level-category' ? '✕' : '+' }}</span>
        </button>
      </div>
    </div>
    
    <div class="category-list" ref="categoryTreeRef">
      <!-- 系统分类选项 -->
      <div class="system-categories">
        <div class="category-node">
          <div
            :class="['category-item', 'system-category', { 
              'active': commandStore.selectedCategory === 'recent'
            }]"
            @click="selectCategory('recent')"
          >
            <div class="category-content">
              <span class="category-icon">🕒</span>
              <span class="category-name">最近使用</span>
              <span class="category-count">{{ commandStore.recentCommands.length }}</span>
            </div>
          </div>
        </div>


      </div>

      <div class="category-divider"></div>

      <!-- 新增一级分类输入框 -->
      <div v-if="inlineEditingCategory === 'new-top-level-category'" class="new-top-level-category">
        <div class="category-item level-0">
          <div class="category-content">
            <div class="category-name-wrapper">
              <input
                v-model="newCategoryName"
                type="text"
                class="category-name-input top-level-category-input"
                @keydown="handleTopLevelKeydown"
                @click.stop
                placeholder="输入新分类名称..."
              />
              <div class="inline-edit-actions" @click.stop>
                <button 
                  class="action-btn confirm-btn" 
                  @click="saveTopLevelCategory"
                  @mousedown.prevent
                  title="确认"
                >
                  ✓
                </button>
                <button 
                  class="action-btn cancel-btn" 
                  @click="cancelInlineEdit"
                  @mousedown.prevent
                  title="取消"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="category-level" data-level="0">
        <div
          v-for="category in filteredCategoryTree"
          :key="category.id"
          :data-id="category.id"
          class="category-node"
        >
          <!-- 一级分类项 -->
          <div
            :class="['category-item', `level-${category.level}`, { 
              'active': commandStore.selectedCategory === category.id,
              'has-children': category.id !== 'all' && (category.children.length > 0 || inlineEditingCategory === `new-category-${category.id}`),
              'expanded': expandedCategories.includes(category.id)
            }]"
            @click="selectCategory(category.id)"
          >
            <div class="category-content">
              <span 
                v-if="category.id !== 'all' && (category.children.length > 0 || inlineEditingCategory === `new-category-${category.id}`)"
                :class="['category-icon', 'expand-icon', { 'expanded': expandedCategories.includes(category.id) }]"
                @click.stop="toggleCategory(category.id)"
              >
                ▶
              </span>

              <!-- 分类名称编辑区域 -->
              <div class="category-name-wrapper">
                <template v-if="inlineEditingCategory === category.id">
                  <input
                    v-model="newCategoryName"
                    type="text"
                    class="category-name-input"
                    @keydown="handleInlineKeydown"
                    @click.stop
                    ref="categoryNameInput"
                  />
                  <div class="inline-edit-actions" @click.stop>
                    <button 
                      class="action-btn confirm-btn" 
                      @click="saveInlineCategory"
                      @mousedown.prevent
                      title="确认"
                    >
                      ✓
                    </button>
                    <button 
                      class="action-btn cancel-btn" 
                      @click="cancelInlineEdit"
                      @mousedown.prevent
                      title="取消"
                    >
                      ×
                    </button>
                  </div>
                </template>
                <span 
                  v-else 
                  class="category-name"
                  @dblclick.stop="editCategory(category)"
                >
                  {{ category.name }}
                </span>
              </div>

              <span class="category-count">{{ getCategoryCount(category.id) }}</span>
            </div>
            <!-- 一级分类的操作按钮 -->
            <div v-if="category.id !== '全部'" class="category-actions" @click.stop>
              <template v-if="category.id === 'recycle-bin'">
                <button class="action-btn clear-btn" @click="clearRecycleBin" title="清空回收站">
                  🗑️
                </button>
              </template>
              <template v-else>
                <button v-if="category.id !== 'all'" class="action-btn add-btn" @click="addSubCategory(category)" :title="inlineEditingCategory === `new-category-${category.id}` ? '取消新增' : '添加子分类'">
                  {{ inlineEditingCategory === `new-category-${category.id}` ? '✕' : '+' }}
                </button>
                <button v-if="category.id !== 'all'" class="action-btn edit-btn" @click="editCategory(category)" :title="inlineEditingCategory === category.id ? '取消编辑' : '编辑分类'">
                  {{ inlineEditingCategory === category.id ? '✕' : '✏️' }}
                </button>
                <button v-if="category.id !== 'all'" class="action-btn delete-btn" @click="deleteCategory(category)" title="删除分类">
                  ×
                </button>
              </template>
            </div>
          </div>

          <!-- 移除一级分类的内联编辑容器 -->

          <!-- 二级分类列表 -->
          <Transition name="category-expand">
            <div 
              v-if="category.id !== 'all' && expandedCategories.includes(category.id) && (category.children.length > 0 || inlineEditingCategory === `new-category-${category.id}`)"
              class="category-children"
            >
              <div class="category-level" :data-level="1">
                <!-- 新分类输入框 -->
                <div v-if="inlineEditingCategory === `new-category-${category.id}`" class="category-node">
                  <div :class="['category-item', `level-${category.level + 1}`]">
                    <div class="category-content">
                      <div class="category-name-wrapper">
                  <input
                    v-model="newCategoryName"
                    type="text"
                          class="category-name-input"
                    @keydown="handleInlineKeydown"
                          ref="categoryNameInput"
                          placeholder="输入新分类名称..."
                  />
                  <div class="inline-edit-actions">
                    <button 
                      class="action-btn confirm-btn" 
                      @click="saveInlineCategory"
                      @mousedown.prevent
                            title="确认"
                    >
                      ✓
                    </button>
                    <button 
                      class="action-btn cancel-btn" 
                      @click="cancelInlineEdit"
                      @mousedown.prevent
                      title="取消"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
                </div>

                <!-- 现有分类列表 -->
                <div
                  v-for="child in category.children"
                  :key="child.id"
                  :data-id="child.id"
                  class="category-node"
                >
                  <!-- 二级分类项 -->
                  <div
                    :class="['category-item', `level-${child.level}`, { 
                      'active': commandStore.selectedCategory === child.id,
                      'has-children': child.children.length > 0 || inlineEditingCategory === `new-category-${child.id}`,
                      'expanded': expandedCategories.includes(child.id)
                    }]"
                    @click="selectCategory(child.id)"
                  >
                    <div class="category-content">
                      <span 
                        v-if="child.children.length > 0 || inlineEditingCategory === `new-category-${child.id}`"
                        :class="['category-icon', 'expand-icon', { 'expanded': expandedCategories.includes(child.id) }]"
                        @click.stop="toggleCategory(child.id)"
                      >
                        ▶
                      </span>

                      <!-- 分类名称编辑区域 -->
                      <div class="category-name-wrapper">
                        <template v-if="inlineEditingCategory === child.id">
                          <input
                            v-model="newCategoryName"
                            type="text"
                            class="category-name-input"
                            @keydown="handleInlineKeydown"
                            @click.stop
                            ref="categoryNameInput"
                          />
                          <div class="inline-edit-actions" @click.stop>
                            <button 
                              class="action-btn confirm-btn" 
                              @click="saveInlineCategory"
                              @mousedown.prevent
                              title="确认"
                            >
                              ✓
                            </button>
                            <button 
                              class="action-btn cancel-btn" 
                              @click="cancelInlineEdit"
                              @mousedown.prevent
                              title="取消"
                            >
                              ×
                            </button>
                          </div>
                        </template>
                        <span 
                          v-else 
                          class="category-name"
                          @dblclick.stop="editCategory(child)"
                        >
                          {{ child.name }}
                        </span>
                        </div>

                      <span class="category-count">{{ getCategoryCount(child.id) }}</span>
                      </div>
                    <!-- 二级分类的操作按钮 -->
                    <div class="category-actions" @click.stop>
                      <template v-if="child.parentId === 'recycle-bin'">
                        <!-- 回收站中的分类：显示恢复和永久删除按钮 -->
                        <button class="action-btn restore-btn" @click="restoreCategory(child)" title="恢复分类">
                          ↩️
                      </button>
                        <button class="action-btn delete-btn" @click="permanentDeleteCategory(child)" title="永久删除分类">
                          ×
                        </button>
                      </template>
                      <template v-else>
                        <!-- 正常分类：显示常规操作按钮 -->
                        <button class="action-btn add-btn" @click="addSubCategory(child)" :title="inlineEditingCategory === `new-category-${child.id}` ? '取消新增' : '添加子分类'">
                          {{ inlineEditingCategory === `new-category-${child.id}` ? '✕' : '+' }}
                        </button>
                        <button class="action-btn edit-btn" @click="editCategory(child)" :title="inlineEditingCategory === child.id ? '取消编辑' : '编辑分类'">
                          {{ inlineEditingCategory === child.id ? '✕' : '✏️' }}
                      </button>
                      <button class="action-btn delete-btn" @click="deleteCategory(child)" title="删除分类">
                        ×
                      </button>
                      </template>
                    </div>
                  </div>

                  <!-- 移除二级分类的内联编辑容器 -->

                  <!-- 三级分类列表 -->
                  <Transition name="category-expand">
                    <div 
                      v-if="expandedCategories.includes(child.id) && (child.children.length > 0 || inlineEditingCategory === child.id || inlineEditingCategory === `new-category-${child.id}`)"
                      class="category-children"
                    >
                      <div class="category-level" :data-level="2">
                        <div
                          v-for="grandChild in child.children"
                          :key="grandChild.id"
                          :data-id="grandChild.id"
                          class="category-node"
                        >
                          <!-- 三级分类项 -->
                          <div
                            :class="['category-item', `level-${grandChild.level}`, { 
                              'active': commandStore.selectedCategory === grandChild.id,
                              'has-children': grandChild.children.length > 0 || inlineEditingCategory === `new-category-${grandChild.id}`,
                              'expanded': expandedCategories.includes(grandChild.id)
                            }]"
                            @click="selectCategory(grandChild.id)"
                          >
                            <div class="category-content">
                              <span 
                                v-if="grandChild.children.length > 0 || inlineEditingCategory === `new-category-${grandChild.id}`"
                                :class="['category-icon', 'expand-icon', { 'expanded': expandedCategories.includes(grandChild.id) }]"
                                @click.stop="toggleCategory(grandChild.id)"
                              >
                                ▶
                              </span>

                              <!-- 分类名称编辑区域 -->
                              <div class="category-name-wrapper">
                                <template v-if="inlineEditingCategory === grandChild.id">
                                  <input
                                    v-model="newCategoryName"
                                    type="text"
                                    class="category-name-input"
                                    @keydown="handleInlineKeydown"
                                    @click.stop
                                    ref="categoryNameInput"
                                  />
                                  <div class="inline-edit-actions" @click.stop>
                                    <button 
                                      class="action-btn confirm-btn" 
                                      @click="saveInlineCategory"
                                      @mousedown.prevent
                                      title="确认"
                                    >
                                      ✓
                                    </button>
                                    <button 
                                      class="action-btn cancel-btn" 
                                      @click="cancelInlineEdit"
                                      @mousedown.prevent
                                      title="取消"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </template>
                                <span 
                                  v-else 
                                  class="category-name"
                                  @dblclick.stop="editCategory(grandChild)"
                                >
                                  {{ grandChild.name }}
                                </span>
                                </div>

                              <span class="category-count">{{ getCategoryCount(grandChild.id) }}</span>
                              </div>
                            <!-- 三级分类的操作按钮 -->
                            <div class="category-actions" @click.stop>
                              <template v-if="isInRecycleBin(grandChild)">
                                <!-- 回收站中的分类：显示恢复和永久删除按钮 -->
                                <button class="action-btn restore-btn" @click="restoreCategory(grandChild)" title="恢复分类">
                                  ↩️
                              </button>
                                <button class="action-btn delete-btn" @click="permanentDeleteCategory(grandChild)" title="永久删除分类">
                                  ×
                                </button>
                              </template>
                              <template v-else>
                                <!-- 正常分类：显示常规操作按钮 -->
                                <button v-if="grandChild.level < 3" class="action-btn add-btn" @click="addSubCategory(grandChild)" :title="inlineEditingCategory === `new-category-${grandChild.id}` ? '取消新增' : '添加子分类'">
                                  {{ inlineEditingCategory === `new-category-${grandChild.id}` ? '✕' : '+' }}
                                </button>
                                <button class="action-btn edit-btn" @click="editCategory(grandChild)" :title="inlineEditingCategory === grandChild.id ? '取消编辑' : '编辑分类'">
                                  {{ inlineEditingCategory === grandChild.id ? '✕' : '✏️' }}
                              </button>
                              <button class="action-btn delete-btn" @click="deleteCategory(grandChild)" title="删除分类">
                                ×
                              </button>
                              </template>
                            </div>
                          </div>

                          <!-- 移除三级分类的内联编辑容器 -->

                          <!-- 四级分类列表 -->
                          <Transition name="category-expand">
                            <div 
                              v-if="expandedCategories.includes(grandChild.id) && (grandChild.children.length > 0 || inlineEditingCategory === grandChild.id || inlineEditingCategory === `new-category-${grandChild.id}`)"
                              class="category-children"
                            >
                              <div class="category-level" :data-level="3">
                                <div
                                  v-for="greatGrandChild in grandChild.children"
                                  :key="greatGrandChild.id"
                                  :data-id="greatGrandChild.id"
                                  class="category-node"
                                >
                                  <div
                                    :class="['category-item', `level-${greatGrandChild.level}`, { 
                                      'active': commandStore.selectedCategory === greatGrandChild.id
                                    }]"
                                    @click="selectCategory(greatGrandChild.id)"
                                  >
                                    <div class="category-content">
                                      <!-- 分类名称编辑区域 -->
                                      <div class="category-name-wrapper">
                                        <template v-if="inlineEditingCategory === greatGrandChild.id">
                                          <input
                                            v-model="newCategoryName"
                                            type="text"
                                            class="category-name-input"
                                            @keydown="handleInlineKeydown"
                                            @click.stop
                                            ref="categoryNameInput"
                                          />
                                          <div class="inline-edit-actions" @click.stop>
                                            <button 
                                              class="action-btn confirm-btn" 
                                              @click="saveInlineCategory"
                                              @mousedown.prevent
                                              title="确认"
                                            >
                                              ✓
                                            </button>
                                            <button 
                                              class="action-btn cancel-btn" 
                                              @click="cancelInlineEdit"
                                              @mousedown.prevent
                                              title="取消"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </template>
                                        <span 
                                          v-else 
                                          class="category-name"
                                          @dblclick.stop="editCategory(greatGrandChild)"
                                        >
                                          {{ greatGrandChild.name }}
                                        </span>
                                      </div>

                                      <span class="category-count">{{ getCategoryCount(greatGrandChild.id) }}</span>
                                    </div>
                                    <!-- 四级分类的操作按钮 -->
                                    <div class="category-actions" @click.stop>
                                      <template v-if="isInRecycleBin(greatGrandChild)">
                                        <!-- 回收站中的分类：显示恢复和永久删除按钮 -->
                                        <button class="action-btn restore-btn" @click="restoreCategory(greatGrandChild)" title="恢复分类">
                                          ↩️
                                        </button>
                                        <button class="action-btn delete-btn" @click="permanentDeleteCategory(greatGrandChild)" title="永久删除分类">
                                          ×
                                        </button>
                                      </template>
                                      <template v-else>
                                        <!-- 正常分类：显示常规操作按钮 -->
                                        <button class="action-btn edit-btn" @click="editCategory(greatGrandChild)" :title="inlineEditingCategory === greatGrandChild.id ? '取消编辑' : '编辑分类'">
                                          {{ inlineEditingCategory === greatGrandChild.id ? '✕' : '✏️' }}
                                      </button>
                                      <button class="action-btn delete-btn" @click="deleteCategory(greatGrandChild)" title="删除分类">
                                        ×
                                      </button>
                                      </template>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Transition>
                        </div>
                        
                        <!-- 新分类输入框 (三级分类) -->
                        <div v-if="inlineEditingCategory === `new-category-${child.id}`" class="category-node">
                          <div :class="['category-item', `level-${child.level + 1}`]">
                            <div class="category-content">
                              <div class="category-name-wrapper">
                                <input
                                  v-model="newCategoryName"
                                  type="text"
                                  class="category-name-input"
                                  @keydown="handleInlineKeydown"
                                  ref="categoryNameInput"
                                  placeholder="输入新分类名称..."
                                />
                                <div class="inline-edit-actions">
                                  <button 
                                    class="action-btn confirm-btn" 
                                    @click="saveInlineCategory"
                                    @mousedown.prevent
                                    title="保存"
                                  >
                                    ✓
                                  </button>
                                  <button 
                                    class="action-btn cancel-btn" 
                                    @click="cancelInlineEdit"
                                    @mousedown.prevent
                                    title="取消"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
    
    <!-- 固定的回收站 -->
    <div class="recycle-bin-section">
      <div class="recycle-bin-divider"></div>
      <div class="category-node">
        <div
          :class="['category-item', 'recycle-bin-item', { 
            'active': commandStore.selectedCategory === 'recycle-bin'
          }]"
          @click="selectCategory('recycle-bin')"
        >
          <div class="category-content">
            <span class="recycle-icon">🗑️</span>
            <span class="category-name">回收站</span>
            <span class="category-count">{{ getCategoryCount('recycle-bin') }}</span>
          </div>
          <div class="category-actions" @click.stop>
            <button class="action-btn clear-btn" @click="clearRecycleBin" title="清空回收站">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类编辑模态框 -->
    <CategoryEditModal
      v-model:show="showEditModal"
      :category="editingCategory"
      :parent-category="parentCategory"
      @confirm="handleCategoryEdit"
    />
    
    <!-- 分类删除确认模态框 -->
    <CategoryDeleteModal
      v-model:show="showDeleteModal"
      :category="categoryToDelete"
      @confirm="handleCategoryDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useCommandStore } from '../stores/command'
import CategoryEditModal from './CategoryEditModal.vue'
import CategoryDeleteModal from './CategoryDeleteModal.vue'
import { toast } from '../utils/toast'
import Sortable from 'sortablejs'


const commandStore = useCommandStore()

// 不再需要props，直接使用store中的状态

// 分类树DOM引用
const categoryTreeRef = ref(null)

// 初始化拖拽排序
const initSortable = () => {
  if (!categoryTreeRef.value) return

  const levelContainers = categoryTreeRef.value.querySelectorAll('.category-level')
  
  levelContainers.forEach((container) => {
    new Sortable(container, {
      group: 'nested-categories',
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      handle: '.category-item',
      onEnd: (evt) => {
        const { to, newIndex, oldIndex, item } = evt
        const movedItemId = item.dataset.id
        const newParentEl = to
        const newParentLevel = parseInt(newParentEl.dataset.level, 10)
        
        let newParentId = null
        if (newParentLevel > 0) {
          const parentNode = newParentEl.closest('.category-node')
          if (parentNode) {
            newParentId = parentNode.dataset.id
          }
        }
        
        // 获取排序后的新顺序
        const orderedIds = Array.from(to.children).map(el => el.dataset.id)
        
        // 更新 store
        commandStore.updateCategoryOrder({
          movedItemId,
          newParentId,
          newIndex,
          orderedIds,
        })
      }
    })
  })
}

// 在组件挂载后初始化拖拽和加载展开状态
onMounted(() => {
  // 从本地存储加载展开状态
  const savedExpanded = localStorage.getItem('categoryTreeExpanded')
  if (savedExpanded) {
    try {
      expandedCategories.value = JSON.parse(savedExpanded)
    } catch (error) {
      console.warn('Failed to parse saved expanded categories:', error)
      // 设置默认展开的分类
      expandedCategories.value = ['dev-tools']
    }
  } else {
    // 设置默认展开的分类
    expandedCategories.value = ['dev-tools']
  }
  
  nextTick(() => {
    initSortable()
  })
})

// 展开的分类 - 从本地存储加载
const expandedCategories = ref([])

// 判断是否有展开的分类
const hasExpandedCategories = computed(() => {
  return expandedCategories.value.length > 0
})

// 模态框状态
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingCategory = ref(null)
const categoryToDelete = ref(null)
const parentCategory = ref(null)

// 内联编辑状态
const inlineEditingCategory = ref(null) // 正在编辑的父分类ID
const newCategoryName = ref('') // 新分类名称

// 分类树
const categoryTree = computed(() => commandStore.categoryTree)

// 过滤后的分类树（排除回收站）
const filteredCategoryTree = computed(() => {
  return categoryTree.value.filter(category => category.id !== 'recycle-bin')
})

// 选择分类
const selectCategory = (categoryId) => {
  // 如果点击的是当前已选中的分类，则取消选择（切换为"全部"）
  if (commandStore.selectedCategory === categoryId) {
    commandStore.selectedCategory = 'all'
  } else {
    commandStore.selectedCategory = categoryId
  }
}

// 切换分类展开状态
const toggleCategory = (categoryId) => {
  const index = expandedCategories.value.indexOf(categoryId)
  if (index > -1) {
    // 收起时，同时收起所有子分类
    expandedCategories.value.splice(index, 1)
    
    // 递归收起所有子分类
    const collapseChildren = (parentId) => {
      const category = commandStore.categories.find(cat => cat.id === parentId)
      if (category && category.children) {
        category.children.forEach(child => {
          const childIndex = expandedCategories.value.indexOf(child.id)
          if (childIndex > -1) {
            expandedCategories.value.splice(childIndex, 1)
            collapseChildren(child.id)
          }
        })
      }
    }
    collapseChildren(categoryId)
  } else {
    expandedCategories.value.push(categoryId)
  }
  
  // 保存展开状态到本地存储
  localStorage.setItem('categoryTreeExpanded', JSON.stringify(expandedCategories.value))
}

// 智能切换所有分类展开状态
const toggleAllCategories = () => {
  if (hasExpandedCategories.value) {
    // 如果有展开的分类，全部收回
    expandedCategories.value = []
  } else {
    // 如果全部收回，全部展开
    const allCategoryIds = []
    
    // 递归收集所有分类ID
    const collectCategoryIds = (categories) => {
      categories.forEach(category => {
        if (category.id !== 'all' && category.id !== 'recycle-bin') {
          allCategoryIds.push(category.id)
          if (category.children && category.children.length > 0) {
            collectCategoryIds(category.children)
          }
        }
      })
    }
    
    collectCategoryIds(commandStore.categories)
    expandedCategories.value = [...allCategoryIds]
  }
  
  // 保存展开状态到本地存储
  localStorage.setItem('categoryTreeExpanded', JSON.stringify(expandedCategories.value))
}

// 获取分类下的命令数量
const getCategoryCount = (categoryId) => {
  if (categoryId === 'all') {
    return commandStore.commands.filter(cmd => cmd.category !== 'recycle-bin').length
  }
  
  if (categoryId === 'recycle-bin') {
    return commandStore.commands.filter(cmd => cmd.category === 'recycle-bin').length
  }
  
  // 只计算直接属于该分类的命令数量
  return commandStore.commands.filter(cmd => cmd.category === categoryId).length
}

// 添加子分类
const addSubCategory = (parent) => {
  // 检查是否可以添加子分类（最多4级）
  if (parent.level >= 3) {
    toast.error('最多只能创建四级分类')
    return
  }
  
  // 创建新的分类ID，包含父分类ID
  const newCategoryId = `new-category-${parent.id}`
  
  if (inlineEditingCategory.value === newCategoryId) {
    // 如果正在新增该子分类，则取消
    cancelInlineEdit()
  } else {
  // 确保父分类是展开的
  if (!expandedCategories.value.includes(parent.id)) {
    expandedCategories.value.push(parent.id)
    // 保存展开状态到本地存储
    localStorage.setItem('categoryTreeExpanded', JSON.stringify(expandedCategories.value))
  }
  
  // 启动内联编辑
  inlineEditingCategory.value = newCategoryId
  newCategoryName.value = ''
  
  // 下一帧聚焦到输入框
  nextTick(() => {
    const input = document.querySelector('.category-name-input')
    if (input) {
      input.focus()
    }
  })
  }
}

// 检查同级分类是否有重名
const checkCategoryNameExists = (name, parentId, excludeId) => {
  const siblings = commandStore.categories.filter(cat => {
    // 同一个父分类下的其他分类
    return cat.parentId === parentId && cat.id !== excludeId
  })
  return siblings.some(cat => cat.name === name)
}

// 保存内联编辑的分类
const saveInlineCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) {
    toast.error('分类名称不能为空')
    return
  }
  
  // 如果是编辑现有分类
  if (!inlineEditingCategory.value.startsWith('new-category-')) {
    const currentCategory = commandStore.categories.find(cat => cat.id === inlineEditingCategory.value)
    if (!currentCategory) {
      toast.error('找不到分类')
      return
    }

    // 检查同级分类是否有重名
    if (checkCategoryNameExists(name, currentCategory.parentId, currentCategory.id)) {
      toast.error('同级分类下已存在相同名称的分类')
      return
    }

    try {
      const success = commandStore.updateCategory(currentCategory.id, {
        ...currentCategory,
        name
      })
      
      if (success) {
        // 重置状态
        inlineEditingCategory.value = null
        newCategoryName.value = ''
        toast.success('分类更新成功')
      } else {
        toast.error('分类更新失败')
      }
    } catch (error) {
      console.error('更新分类失败:', error)
      toast.error('更新失败: ' + error.message)
    }
  } 
  // 如果是添加新的子分类
  else {
    const parentId = inlineEditingCategory.value.split('-')[2]
    const parent = commandStore.categories.find(cat => cat.id === parentId)
    
  if (!parent) {
    toast.error('找不到父分类')
    return
  }

    // 检查同级分类是否有重名
    if (checkCategoryNameExists(name, parent.id)) {
      toast.error('同级分类下已存在相同名称的分类')
    return
  }
  
  try {
    await commandStore.addCategory({
        name,
      parentId: parent.id,
      level: parent.level + 1
    })
    
    // 重置状态
    inlineEditingCategory.value = null
    newCategoryName.value = ''
    toast.success('分类添加成功')
  } catch (error) {
    toast.error('添加分类失败: ' + error.message)
    }
  }
}

// 取消内联编辑
const cancelInlineEdit = () => {
  inlineEditingCategory.value = null
  newCategoryName.value = ''
}

// 处理输入框失焦 - 延迟执行以防止与按钮点击冲突
const handleInputBlur = () => {
  // 使用短暂延迟，如果用户点击了按钮，则不取消编辑
  setTimeout(() => {
    if (inlineEditingCategory.value !== null) {
      cancelInlineEdit()
    }
  }, 150)
}

// 处理内联编辑的键盘事件
const handleInlineKeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveInlineCategory()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelInlineEdit()
  }
}

// 处理新增一级分类的键盘事件
const handleTopLevelKeydown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveTopLevelCategory()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelInlineEdit()
  }
}

// 删除分类
const deleteCategory = (category) => {
  // 系统分类不能删除
  if (category.id === 'all' || category.id === 'recycle-bin') {
    toast.error('系统分类不能删除')
    return
  }
  
  const categoryName = category.name
  const confirmMessage = category.isUserCreated 
    ? `确定要删除分类 '${categoryName}' 吗？删除后将移至回收站，可在30天内恢复。`
    : `确定要隐藏示例分类 '${categoryName}' 吗？隐藏后将不再显示。`
  
  // 显示确认对话框
  if (confirm(confirmMessage)) {
    if (commandStore.deleteCategory(category.id)) {
      if (category.isUserCreated) {
        toast.success(`分类 '${categoryName}' 已移至回收站`)
      } else {
        toast.success(`示例分类 '${categoryName}' 已隐藏`)
      }
    } else {
      toast.error('删除分类失败')
    }
  }
}

// 处理分类编辑确认
const handleCategoryEdit = (categoryData) => {
  try {
    const success = commandStore.updateCategory(editingCategory.value.id, categoryData)
      if (success) {
        toast.success('分类更新成功')
      showEditModal.value = false
      editingCategory.value = null
      } else {
        toast.error('分类更新失败')
      }
  } catch (error) {
    console.error('分类操作失败:', error)
    toast.error('操作失败，请重试')
  }
}

// 处理分类删除确认
const handleCategoryDelete = () => {
  try {
    const success = commandStore.deleteCategory(categoryToDelete.value.id)
    if (success) {
      toast.success('分类删除成功，相关命令已移至回收站')
      showDeleteModal.value = false
      categoryToDelete.value = null
    } else {
      toast.error('分类删除失败')
    }
  } catch (error) {
    console.error('分类删除失败:', error)
    toast.error('删除失败，请重试')
  }
}

// 清空回收站
const clearRecycleBin = () => {
  const recycleBinCommands = commandStore.commands.filter(cmd => cmd.category === 'recycle-bin')
  if (recycleBinCommands.length === 0) {
    toast.info('回收站已经是空的')
    return
  }
  
  if (confirm(`确定要清空回收站吗？这将永久删除 ${recycleBinCommands.length} 个命令，此操作不可撤销！`)) {
    try {
      commandStore.clearRecycleBin()
      toast.success('回收站已清空')
    } catch (error) {
      console.error('清空回收站失败:', error)
      toast.error('清空失败，请重试')
    }
  }
}

// 判断分类是否在回收站中
const isInRecycleBin = (category) => {
  return category.parentId === 'recycle-bin' || category.deletedAt
}

// 恢复分类
const restoreCategory = (category) => {
  if (commandStore.restoreCategory(category.id)) {
    toast.success(`分类 '${category.name}' 已恢复`)
  } else {
    toast.error('恢复分类失败')
  }
}

// 永久删除分类
const permanentDeleteCategory = (category) => {
  const categoryName = category.name
  
  // 显示确认对话框
  if (confirm(`确定要永久删除分类 '${categoryName}' 及其所有子分类吗？此操作不可撤销！`)) {
    if (commandStore.permanentDeleteCategory(category.id)) {
      toast.success(`分类 '${categoryName}' 已永久删除`)
    } else {
      toast.error('删除分类失败')
    }
  }
}

// 编辑分类
const editCategory = (category) => {
  // 系统分类不能编辑
  if (category.id === 'all' || category.id === 'recycle-bin') {
    toast.error('系统分类不能编辑')
    return
  }
  
  if (inlineEditingCategory.value === category.id) {
    // 如果正在编辑该分类，则取消编辑
    cancelInlineEdit()
  } else {
  // 启动内联编辑
  inlineEditingCategory.value = category.id
  newCategoryName.value = category.name
  
  // 下一帧聚焦到输入框并选中全部文本
  nextTick(() => {
    const input = document.querySelector('.category-name-input')
    if (input) {
      input.focus()
      input.select()
    }
  })
  }
}

// 添加一级分类
const addTopLevelCategory = () => {
  if (inlineEditingCategory.value === 'new-top-level-category') {
    // 如果正在新增一级分类，则取消
    cancelInlineEdit()
  } else {
    // 启动内联编辑模式创建新的一级分类
    inlineEditingCategory.value = 'new-top-level-category'
    newCategoryName.value = ''
    
    // 下一帧聚焦到输入框
    nextTick(() => {
      const input = document.querySelector('.top-level-category-input')
      if (input) {
        input.focus()
      }
    })
  }
}

// 保存新的一级分类
const saveTopLevelCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) {
    toast.error('分类名称不能为空')
    return
  }
  
  // 检查是否有重名的一级分类
  const existingCategory = commandStore.categories.find(cat => 
    cat.name === name && cat.level === 0 && cat.id !== 'all' && cat.id !== 'recycle-bin'
  )
  
  if (existingCategory) {
    toast.error('已存在相同名称的一级分类')
    return
  }
  
  try {
    await commandStore.addCategory({
      name,
      parentId: null,
      level: 0
    })
    
    // 重置状态
    inlineEditingCategory.value = null
    newCategoryName.value = ''
    toast.success('一级分类添加成功')
  } catch (error) {
    toast.error('添加分类失败: ' + error.message)
  }
}

// 边框调整相关的状态
const isResizing = ref(false)
const resizePosition = ref('')
const startX = ref(0)
const startY = ref(0)
const startWidth = ref(0)
const startHeight = ref(0)
const startBorderWidth = ref(1)
const startBorderRadius = ref(4)


</script>

<style lang="scss" scoped>
.category-tree {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.category-header {
  padding: var(--el-spacing-md);
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .category-title {
    font-size: var(--el-font-size-base);
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  .category-controls {
    display: flex;
    align-items: center;
    gap: var(--el-spacing-xs);
  }
  
  .control-btn {
    width: 24px;
    height: 24px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    color: var(--el-text-color-regular);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--el-transition-duration);
    font-size: 12px;
    
    &:hover {
      background: var(--el-fill-color-light);
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      transform: translateY(-1px);
      box-shadow: var(--el-box-shadow-light);
    }
    
    &:active {
      transform: translateY(0);
      background: var(--el-fill-color-lighter);
    }
  }
  
  .toggle-expand-btn {
    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }
  
  .add-category-btn {
    width: 28px;
    height: 28px;
    background: var(--el-color-primary);
    border: 1px solid var(--el-color-primary);
    border-radius: var(--el-border-radius-base);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--el-transition-duration);
    
    &:hover {
      background: var(--el-color-primary-light-3);
      border-color: var(--el-color-primary-light-3);
      transform: translateY(-1px);
      box-shadow: var(--el-box-shadow);
    }
    
    &:active {
      transform: translateY(0);
      background: var(--el-color-primary-dark-2);
    }
    
    .add-icon {
      font-size: var(--el-font-size-base);
      font-weight: bold;
    }
  }
}

.category-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);

  .category-level {
    min-height: 30px;
  }
}

// 拖拽相关样式
.sortable-ghost {
  opacity: 0.5;
  background: var(--el-color-primary-light-9);
  border: 1px dashed var(--el-color-primary);
  border-radius: var(--el-border-radius-base);
}

.sortable-drag {
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  border-radius: var(--el-border-radius-base);
  opacity: 0.9;
}

.category-node {
  margin-bottom: 2px;
}

.category-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--el-padding-sm) var(--el-padding-base);
  border: var(--category-item-border-width) solid var(--category-item-border-color);
  border-radius: var(--category-item-radius);
  cursor: pointer;
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
  user-select: none;
  margin: var(--el-spacing-xs) 0;
  
  &:hover {
    background: var(--el-menu-hover-bg-color);
    border-color: var(--el-color-primary-light-7);
    
    .category-actions,
    .settings-trigger {
      opacity: 1;
    }
    .resize-handle {
      opacity: 1;
    }
  }
  
  &.active {
    .category-name {
      color: var(--el-menu-active-color);
      font-weight: var(--el-font-weight-primary);
    }
    
    .category-count {
      background: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      border: 1px solid var(--el-color-primary-light-5);
    }
    

  }
  
  
  
  &.level-0 {
    font-weight: 600;
    font-size: var(--el-font-size-base);
    border-left: 5px solid var(--el-color-primary);
    
    &:hover {
      background: var(--el-fill-color-light);
    }
    
    &.active {
      background: var(--el-color-primary-light-9);
      border-left-color: var(--el-color-primary-dark-2);
      border-left-width: 6px;
    }
  }
  
  &.level-1 {
    font-weight: 500;
    font-size: var(--el-font-size-small);
    border-left: 5px solid var(--el-color-success);
    margin-left: var(--el-spacing-lg);
    
    &:hover {
      background: var(--el-fill-color-light);
    }
    
    &.active {
      background: var(--el-color-success-light-9);
      border-left-color: var(--el-color-success-dark-2);
      border-left-width: 6px;
    }
  }
  
  &.level-2 {
    font-weight: normal;
    font-size: var(--el-font-size-small);
    border-left: 5px solid var(--el-color-warning);
    margin-left: calc(var(--el-spacing-lg) + var(--el-spacing-md));
    
    &:hover {
      background: var(--el-fill-color-light);
    }
    
    &.active {
      background: var(--el-color-warning-light-9);
      border-left-color: var(--el-color-warning-dark-2);
      border-left-width: 6px;
    }
  }
  
  &.level-3 {
    font-weight: normal;
    font-size: var(--el-font-size-extra-small);
    border-left: 5px solid var(--el-color-info);
    margin-left: calc(var(--el-spacing-lg) + var(--el-spacing-lg));
    color: var(--el-text-color-regular);
    
    &:hover {
      background: var(--el-fill-color-light);
    }
    
    &.active {
      background: var(--el-color-info-light-9);
      border-left-color: var(--el-color-info-dark-2);
      border-left-width: 6px;
    }
  }
}

.category-content {
  display: flex;
  align-items: center;
  gap: var(--el-spacing-sm);
  

  
  .category-icon {
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--el-text-color-secondary);
    transition: var(--el-transition-all);
    cursor: pointer;
    border-radius: var(--el-border-radius-small);
    
    &:hover {
      background: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }
    
    &.expand-icon {
      margin-right: 4px;
    
    &.expanded {
      transform: rotate(90deg);
      color: var(--el-color-primary);
      }
    }
  }
  
  .recycle-icon {
    font-size: 12px;
    flex-shrink: 0;
  }
  
  .category-name {
    flex: 1;
    color: var(--text-primary);
    transition: color 0.2s ease;
  }
  
  .category-count {
    background: var(--bg-secondary);
    color: var(--text-muted);
    font-size: var(--font-size-xs);
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
    transition: all 0.2s ease;
  }
}

.category-children {
  margin-left: var(--spacing-sm);
  border-left: 1px solid var(--border-color);
  padding-left: var(--spacing-sm);
}

// 内联编辑样式 - Element Plus 风格
.inline-edit-container {
  margin-top: var(--el-margin-xs, 4px);
  margin-left: var(--el-margin-md, 16px);
  padding: var(--el-padding-xs, 4px) 0;
  position: relative;
  z-index: 10;
}

.inline-edit-item {
  padding: var(--el-padding-sm) var(--el-padding-base);
  background: var(--el-fill-color-blank);
  border: var(--category-item-border-width) solid var(--category-item-border-color);
  border-radius: var(--category-item-radius);
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
  position: relative;
  box-shadow: var(--el-box-shadow-light);
  margin: var(--el-spacing-xs) 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--el-spacing-sm);
  
  &:hover {
    border-color: var(--el-color-primary-light-7);
  }
  
  &:focus-within {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }
}

.inline-edit-content {
  flex: 1;
  min-width: 0;
}

.inline-category-input {
  width: 100%;
  height: 32px;
  padding: 0 var(--el-input-padding-horizontal);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
  line-height: 30px;
  transition: var(--el-transition-border);
  outline: none;
  
  &:focus {
    border-color: var(--el-color-primary);
  }
  
  &:hover {
    border-color: var(--el-border-color-hover);
  }
  
  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.inline-edit-actions {
  display: flex;
  gap: var(--el-margin-xs);
}

.confirm-btn, .cancel-btn {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  padding: 0 !important;
  font-size: var(--el-font-size-small) !important;
  border-radius: var(--el-border-radius-base) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all var(--el-transition-duration) !important;
  box-shadow: var(--el-box-shadow-light) !important;
}

.confirm-btn {
  background: var(--el-color-success) !important;
  border: 1px solid var(--el-color-success) !important;
  color: white !important;
  
  &:hover {
    background: var(--el-color-success-light-3) !important;
    border-color: var(--el-color-success-light-3) !important;
    transform: translateY(-1px) !important;
    box-shadow: var(--el-box-shadow) !important;
  }
}

.cancel-btn {
  background: var(--el-color-danger) !important;
  border: 1px solid var(--el-color-danger) !important;
  color: white !important;
  
  &:hover {
    background: var(--el-color-danger-light-3) !important;
    border-color: var(--el-color-danger-light-3) !important;
    transform: translateY(-1px) !important;
    box-shadow: var(--el-box-shadow) !important;
  }
}

// 展开动画
.category-expand-enter-active,
.category-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.category-expand-enter-from,
.category-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.category-expand-enter-to,
.category-expand-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

// 内联编辑淡入淡出动画 - Element Plus 风格
.inline-edit-fade-enter-active {
  transition: all 0.3s var(--el-transition-function-ease-in-out-bezier);
}

.inline-edit-fade-leave-active {
  transition: all 0.2s var(--el-transition-function-ease-in-out-bezier);
}

.inline-edit-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.inline-edit-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.inline-edit-fade-enter-to,
.inline-edit-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

// 响应式设计
@media (max-width: 768px) {
  .category-tree {
    width: 200px;
  }
  
  .category-item {
    &.level-2 {
      margin-left: var(--spacing-sm);
    }
    
    &.level-3 {
      margin-left: var(--spacing-md);
    }
  }
  
  .category-children {
    margin-left: var(--spacing-xs);
    padding-left: var(--spacing-xs);
  }
}

// 分类头部样式
.category-header {
  margin-bottom: var(--spacing-md);
}

.category-title {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--text-primary);
}

// 分类操作按钮样式 - Element Plus 风格
.category-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.3s var(--el-transition-function-ease-in-out-bezier);
}

.action-btn {
  width: 24px;
  height: 24px;
  border: var(--button-border-width) solid var(--button-border-color);
  border-radius: var(--button-radius);
  cursor: pointer;
  font-size: var(--el-font-size-base);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  
  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-hover);
  }
  
  &:active {
    background: var(--el-fill-color);
  }
  
  &.add-btn {
    color: var(--el-color-success, #67c23a);
    
    &:hover {
      color: var(--el-color-success-light-3, #95d475);
      background: var(--el-color-success-light-9, #f0f9ff);
      border-color: var(--el-color-success-light-5, #b3e19d);
    }
    
    &:active {
      color: var(--el-color-success-dark-2, #529b2e);
    }
  }
  
  &.edit-btn {
    color: var(--el-color-primary, #409eff);
  
  &:hover {
      color: var(--el-color-primary-light-3, #79bbff);
      background: var(--el-color-primary-light-9, #ecf5ff);
      border-color: var(--el-color-primary-light-5, #a0cfff);
  }
  
  &:active {
      color: var(--el-color-primary-dark-2, #337ecc);
    }
  }
  
  &.delete-btn {
    color: var(--el-color-danger, #f56c6c);
    
    &:hover {
      color: var(--el-color-danger-light-3, #f89898);
      background: var(--el-color-danger-light-9, #fef0f0);
      border-color: var(--el-color-danger-light-5, #fab6b6);
    }
    
    &:active {
      color: var(--el-color-danger-dark-2, #c45656);
    }
  }
  
  &.clear-btn {
    color: var(--el-color-warning, #e6a23c);
    
    &:hover {
      color: var(--el-color-warning-light-3, #eebe77);
      background: var(--el-color-warning-light-9, #fdf6ec);
      border-color: var(--el-color-warning-light-5, #f3d19e);
    }
    
    &:active {
      color: var(--el-color-warning-dark-2, #b88230);
    }
  }
}

// 当分类项处于活跃状态时，操作按钮的样式 - Element Plus 风格
.category-item.active .category-actions {
  opacity: 1;
  
  .action-btn {
    background: var(--el-fill-color-blank, #ffffff);
    border-color: var(--el-border-color-light, #e4e7ed);
    box-shadow: var(--el-box-shadow-light, 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04));
    
    &:hover {
      box-shadow: var(--el-box-shadow, 0 2px 12px 0 rgba(0, 0, 0, 0.1));
      transform: translateY(-1px);
    }
    
    &.add-btn {
      border-color: var(--el-color-success-light-7, #c2e7b0);
      
      &:hover {
        color: var(--el-color-success, #67c23a);
        background: var(--el-color-success-light-9, #f0f9ff);
        border-color: var(--el-color-success, #67c23a);
        box-shadow: 0 2px 12px 0 rgba(103, 194, 58, 0.3);
      }
    }
    
    &.edit-btn {
      border-color: var(--el-color-primary-light-7, #b3d8ff);
      
      &:hover {
        color: var(--el-color-primary, #409eff);
        background: var(--el-color-primary-light-9, #ecf5ff);
        border-color: var(--el-color-primary, #409eff);
        box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.3);
      }
    }
    
    &.delete-btn {
      border-color: var(--el-color-danger-light-7, #f7c6c6);
      
      &:hover {
        color: var(--el-color-danger, #f56c6c);
        background: var(--el-color-danger-light-9, #fef0f0);
        border-color: var(--el-color-danger, #f56c6c);
        box-shadow: 0 2px 12px 0 rgba(245, 108, 108, 0.3);
      }
    }
  }
}

// 回收站固定区域样式
.recycle-bin-section {
  margin-top: auto;
  padding-top: var(--spacing-md);
}

.recycle-bin-divider {
  height: 1px;
  background: var(--border-color);
  margin-bottom: var(--spacing-sm);
}

.recycle-bin-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  
  &:hover {
    background: var(--bg-hover);
    border-color: var(--color-primary);
  }
  
  &.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    
    .category-name {
      color: white;
    }
    
    .category-count {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }
}

.system-categories {
  margin-bottom: var(--el-margin-sm);
  
  .category-node {
    margin-bottom: var(--el-margin-xs);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.system-category {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-border-color-light);
  
  &:hover {
    background: var(--el-color-primary-light-8);
    border-color: var(--el-color-primary-light-5);
  }
  
  &.active {
    background: var(--el-color-primary-light-7);
    border-color: var(--el-color-primary);
    
    .category-name {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    
    .category-count {
      background: var(--el-color-primary-light-5);
      color: var(--el-color-primary-dark-2);
      border: 1px solid var(--el-color-primary);
    }
  }
}

.all-categories {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-border-color-light);
  margin-bottom: var(--el-margin-sm);
  
  &:hover {
    background: var(--el-color-primary-light-8);
    border-color: var(--el-color-primary-light-5);
  }
  
  &.active {
    background: var(--el-color-primary-light-7);
    border-color: var(--el-color-primary);
    
    .category-name {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    
    .category-count {
      background: var(--el-color-primary-light-5);
      color: var(--el-color-primary-dark-2);
      border: 1px solid var(--el-color-primary);
    }
  }
}

.category-divider {
  height: 1px;
  background: var(--el-border-color-light);
  margin: var(--el-margin-sm) 0;
}

.new-top-level-category {
  margin-bottom: var(--el-spacing-sm);
  
  .category-item {
    background: var(--el-color-primary-light-9);
    border: 2px dashed var(--el-color-primary-light-5);
    border-radius: var(--el-border-radius-base);
    
    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-8);
    }
  }
}

.category-name-wrapper {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--el-spacing-sm);
}

.category-name {
  flex: 1;
  color: var(--text-primary);
  transition: color 0.2s ease;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--el-border-radius-base);
  
  &:hover {
    color: var(--el-color-primary);
  }
}

.category-name-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: 0 8px;
  font-size: inherit;
  color: var(--el-text-color-primary);
  outline: none;
  transition: all var(--el-transition-duration);
  
  &:focus {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
  }
  
  &:hover {
    border-color: var(--el-border-color-hover);
  }
}

.inline-edit-actions {
  display: flex;
  gap: 4px;
  margin-left: 4px;
}

.confirm-btn, .cancel-btn {
  width: 24px;
  height: 24px;
  min-width: 24px;
  padding: 0;
  font-size: var(--el-font-size-small);
  border-radius: var(--el-border-radius-base);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--el-transition-duration);
  box-shadow: var(--el-box-shadow-light);
}

.confirm-btn {
  background: var(--el-color-success);
  border: 1px solid var(--el-color-success);
  color: white;
  
  &:hover {
    background: var(--el-color-success-light-3);
    border-color: var(--el-color-success-light-3);
    transform: translateY(-1px);
    box-shadow: var(--el-box-shadow);
  }
}

.cancel-btn {
  background: var(--el-color-danger);
  border: 1px solid var(--el-color-danger);
  color: white;
  
  &:hover {
    background: var(--el-color-danger-light-3);
    border-color: var(--el-color-danger-light-3);
    transform: translateY(-1px);
    box-shadow: var(--el-box-shadow);
  }
}

// 展开动画
.category-expand-enter-active,
.category-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.category-expand-enter-from,
.category-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.category-expand-enter-to,
.category-expand-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

// 内联编辑淡入淡出动画 - Element Plus 风格
.inline-edit-fade-enter-active {
  transition: all 0.3s var(--el-transition-function-ease-in-out-bezier);
}

.inline-edit-fade-leave-active {
  transition: all 0.2s var(--el-transition-function-ease-in-out-bezier);
}

.inline-edit-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.inline-edit-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.inline-edit-fade-enter-to,
.inline-edit-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

// 响应式设计
@media (max-width: 768px) {
  .category-tree {
    width: 200px;
  }
  
  .category-item {
    &.level-2 {
      margin-left: var(--spacing-sm);
    }
    
    &.level-3 {
      margin-left: var(--spacing-md);
    }
  }
  
  .category-children {
    margin-left: var(--spacing-xs);
    padding-left: var(--spacing-xs);
  }
}

// 分类头部样式
.category-header {
  margin-bottom: var(--spacing-md);
}

.category-title {
  font-size: 1.1em;
  font-weight: 600;
  color: var(--text-primary);
}

// 分类操作按钮样式 - Element Plus 风格
.category-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.3s var(--el-transition-function-ease-in-out-bezier);
}

.action-btn {
  width: 24px;
  height: 24px;
  border: var(--button-border-width) solid var(--button-border-color);
  border-radius: var(--button-radius);
  cursor: pointer;
  font-size: var(--el-font-size-base);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  
  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-hover);
  }
  
  &:active {
    background: var(--el-fill-color);
  }
  
  &.add-btn {
    color: var(--el-color-success, #67c23a);
    
    &:hover {
      color: var(--el-color-success-light-3, #95d475);
      background: var(--el-color-success-light-9, #f0f9ff);
      border-color: var(--el-color-success-light-5, #b3e19d);
    }
    
    &:active {
      color: var(--el-color-success-dark-2, #529b2e);
    }
  }
  
  &.edit-btn {
    color: var(--el-color-primary, #409eff);
    
    &:hover {
      color: var(--el-color-primary-light-3, #79bbff);
      background: var(--el-color-primary-light-9, #ecf5ff);
      border-color: var(--el-color-primary-light-5, #a0cfff);
    }
    
    &:active {
      color: var(--el-color-primary-dark-2, #337ecc);
    }
  }
  
  &.delete-btn {
    color: var(--el-color-danger, #f56c6c);
    
    &:hover {
      color: var(--el-color-danger-light-3, #f89898);
      background: var(--el-color-danger-light-9, #fef0f0);
      border-color: var(--el-color-danger-light-5, #fab6b6);
    }
    
    &:active {
      color: var(--el-color-danger-dark-2, #c45656);
    }
  }
  
  &.clear-btn {
    color: var(--el-color-warning, #e6a23c);
    
    &:hover {
      color: var(--el-color-warning-light-3, #eebe77);
      background: var(--el-color-warning-light-9, #fdf6ec);
      border-color: var(--el-color-warning-light-5, #f3d19e);
    }
    
    &:active {
      color: var(--el-color-warning-dark-2, #b88230);
    }
  }
}

// 当分类项处于活跃状态时，操作按钮的样式 - Element Plus 风格
.category-item.active .category-actions {
  opacity: 1;
  
  .action-btn {
    background: var(--el-fill-color-blank, #ffffff);
    border-color: var(--el-border-color-light, #e4e7ed);
    box-shadow: var(--el-box-shadow-light, 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04));
    
    &:hover {
      box-shadow: var(--el-box-shadow, 0 2px 12px 0 rgba(0, 0, 0, 0.1));
      transform: translateY(-1px);
    }
    
    &.add-btn {
      border-color: var(--el-color-success-light-7, #c2e7b0);
      
      &:hover {
        color: var(--el-color-success, #67c23a);
        background: var(--el-color-success-light-9, #f0f9ff);
        border-color: var(--el-color-success, #67c23a);
        box-shadow: 0 2px 12px 0 rgba(103, 194, 58, 0.3);
      }
    }
    
    &.edit-btn {
      border-color: var(--el-color-primary-light-7, #b3d8ff);
      
      &:hover {
        color: var(--el-color-primary, #409eff);
        background: var(--el-color-primary-light-9, #ecf5ff);
        border-color: var(--el-color-primary, #409eff);
        box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.3);
      }
    }
    
    &.delete-btn {
      border-color: var(--el-color-danger-light-7, #f7c6c6);
      
      &:hover {
        color: var(--el-color-danger, #f56c6c);
        background: var(--el-color-danger-light-9, #fef0f0);
        border-color: var(--el-color-danger, #f56c6c);
        box-shadow: 0 2px 12px 0 rgba(245, 108, 108, 0.3);
      }
    }
  }
}

// 回收站固定区域样式
.recycle-bin-section {
  margin-top: auto;
  padding-top: var(--spacing-md);
}

.recycle-bin-divider {
  height: 1px;
  background: var(--border-color);
  margin-bottom: var(--spacing-sm);
}

.recycle-bin-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  
  &:hover {
    background: var(--bg-hover);
    border-color: var(--color-primary);
  }
  
  &.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    
    .category-name {
      color: white;
    }
    
    .category-count {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }
}

.system-categories {
  margin-bottom: var(--el-margin-sm);
  
  .category-node {
    margin-bottom: var(--el-margin-xs);
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.system-category {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-border-color-light);
  
  &:hover {
    background: var(--el-color-primary-light-8);
    border-color: var(--el-color-primary-light-5);
  }
  
  &.active {
    background: var(--el-color-primary-light-7);
    border-color: var(--el-color-primary);
    
    .category-name {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    
    .category-count {
      background: var(--el-color-primary-light-5);
      color: var(--el-color-primary-dark-2);
      border: 1px solid var(--el-color-primary);
    }
  }
}

.all-categories {
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-border-color-light);
  margin-bottom: var(--el-margin-sm);
  
  &:hover {
    background: var(--el-color-primary-light-8);
    border-color: var(--el-color-primary-light-5);
  }
  
  &.active {
    background: var(--el-color-primary-light-7);
    border-color: var(--el-color-primary);
    
    .category-name {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    
    .category-count {
      background: var(--el-color-primary-light-5);
      color: var(--el-color-primary-dark-2);
      border: 1px solid var(--el-color-primary);
    }
  }
}

.category-divider {
  height: 1px;
  background: var(--el-border-color-light);
  margin: var(--el-margin-sm) 0;
}

/* 恢复按钮样式 */
.action-btn.restore-btn {
  color: var(--el-color-success, #67c23a) !important;
  
  &:hover {
    color: var(--el-color-success-light-3, #95d475) !important;
    background: var(--el-color-success-light-9, #f0f9ff) !important;
    border-color: var(--el-color-success-light-5, #b3e19d) !important;
  }
  
  &:active {
    color: var(--el-color-success-dark-2, #529b2e) !important;
  }
}
</style> 