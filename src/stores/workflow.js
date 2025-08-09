import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCommandStore } from './command'

export const useWorkflowStore = defineStore('workflow', () => {
  // 状态
  const workflows = ref([])
  const activeWorkflow = ref(null)
  const executionHistory = ref([])
  
  // 计算属性
  const sortedWorkflows = computed(() => {
    return workflows.value.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    )
  })
  
  // 数据持久化
  const saveToStorage = () => {
    const data = {
      workflows: workflows.value,
      executionHistory: executionHistory.value
    }
    
    if (window.utoolsDB) {
      window.utoolsDB.put({
        _id: 'workflow-data',
        data
      })
    } else {
      localStorage.setItem('command-handbook-workflows', JSON.stringify(data))
    }
  }
  
  const loadFromStorage = () => {
    let data = null
    
    if (window.utoolsDB) {
      const result = window.utoolsDB.get('workflow-data')
      data = result?.data
    } else {
      const stored = localStorage.getItem('command-handbook-workflows')
      data = stored ? JSON.parse(stored) : null
    }
    
    if (data) {
      workflows.value = data.workflows || []
      executionHistory.value = data.executionHistory || []
    }
  }
  
  // 工作流操作
  const addWorkflow = (workflowData) => {
    const newWorkflow = {
      id: generateId(),
      name: workflowData.name || '新工作流',
      description: workflowData.description || '',
      steps: workflowData.steps || [],
      tags: workflowData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    workflows.value.push(newWorkflow)
    saveToStorage()
    return newWorkflow
  }
  
  const updateWorkflow = (id, workflowData) => {
    const index = workflows.value.findIndex(wf => wf.id === id)
    if (index !== -1) {
      workflows.value[index] = {
        ...workflows.value[index],
        ...workflowData,
        updatedAt: new Date().toISOString()
      }
      saveToStorage()
      return workflows.value[index]
    }
    return null
  }
  
  const deleteWorkflow = (id) => {
    const index = workflows.value.findIndex(wf => wf.id === id)
    if (index !== -1) {
      workflows.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }
  
  const getWorkflow = (id) => {
    return workflows.value.find(wf => wf.id === id)
  }
  
  const duplicateWorkflow = (id) => {
    const workflow = getWorkflow(id)
    if (workflow) {
      const newWorkflow = {
        ...workflow,
        id: generateId(),
        name: `${workflow.name} (副本)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      workflows.value.push(newWorkflow)
      saveToStorage()
      return newWorkflow
    }
    return null
  }
  
  // 工作流执行
  const executeWorkflow = async (id, globalParameters = {}) => {
    const workflow = getWorkflow(id)
    if (!workflow) return { success: false, error: '工作流不存在' }
    
    const commandStore = useCommandStore()
    const execution = {
      id: generateId(),
      workflowId: id,
      workflowName: workflow.name,
      startTime: new Date().toISOString(),
      steps: [],
      globalParameters,
      status: 'running'
    }
    
    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i]
        const stepExecution = {
          stepId: step.id,
          stepName: step.name,
          startTime: new Date().toISOString(),
          status: 'running'
        }
        
        try {
          let result
          
          if (step.type === 'command') {
            // 执行命令步骤
            const command = commandStore.getCommand(step.commandId)
            if (!command) {
              throw new Error(`命令不存在: ${step.commandId}`)
            }
            
            // 合并参数
            const parameters = { ...globalParameters, ...step.parameters }
            result = await commandStore.executeCommand(command.command, parameters)
            
            stepExecution.command = result
            stepExecution.status = 'completed'
            
            // 更新命令使用统计
            commandStore.incrementCommandUsage(step.commandId)
            
          } else if (step.type === 'delay') {
            // 延迟步骤
            const delay = step.delay || 1000
            await new Promise(resolve => setTimeout(resolve, delay))
            stepExecution.status = 'completed'
            
          } else if (step.type === 'condition') {
            // 条件步骤
            const condition = evaluateCondition(step.condition, globalParameters)
            if (!condition) {
              stepExecution.status = 'skipped'
              stepExecution.reason = '条件不满足'
              continue
            }
            stepExecution.status = 'completed'
          }
          
          stepExecution.endTime = new Date().toISOString()
          stepExecution.duration = new Date(stepExecution.endTime) - new Date(stepExecution.startTime)
          
        } catch (error) {
          stepExecution.status = 'failed'
          stepExecution.error = error.message
          stepExecution.endTime = new Date().toISOString()
          
          if (step.continueOnError !== true) {
            execution.status = 'failed'
            execution.error = `步骤 "${step.name}" 执行失败: ${error.message}`
            break
          }
        }
        
        execution.steps.push(stepExecution)
      }
      
      if (execution.status === 'running') {
        execution.status = 'completed'
      }
      
    } catch (error) {
      execution.status = 'failed'
      execution.error = error.message
    }
    
    execution.endTime = new Date().toISOString()
    execution.duration = new Date(execution.endTime) - new Date(execution.startTime)
    
    // 保存执行历史
    executionHistory.value.unshift(execution)
    executionHistory.value = executionHistory.value.slice(0, 100) // 只保留最近100条
    saveToStorage()
    
    return execution
  }
  
  // 条件评估
  const evaluateCondition = (condition, parameters) => {
    try {
      // 简单的条件评估器
      // 支持基本的比较操作
      if (condition.type === 'equals') {
        return parameters[condition.variable] === condition.value
      } else if (condition.type === 'not_equals') {
        return parameters[condition.variable] !== condition.value
      } else if (condition.type === 'contains') {
        return String(parameters[condition.variable]).includes(condition.value)
      } else if (condition.type === 'exists') {
        return parameters[condition.variable] !== undefined
      }
      return true
    } catch (error) {
      console.error('条件评估失败:', error)
      return false
    }
  }
  
  // 步骤操作
  const addStep = (workflowId, stepData) => {
    const workflow = getWorkflow(workflowId)
    if (workflow) {
      const newStep = {
        id: generateId(),
        name: stepData.name || '新步骤',
        type: stepData.type || 'command',
        ...stepData
      }
      
      workflow.steps.push(newStep)
      workflow.updatedAt = new Date().toISOString()
      saveToStorage()
      return newStep
    }
    return null
  }
  
  const updateStep = (workflowId, stepId, stepData) => {
    const workflow = getWorkflow(workflowId)
    if (workflow) {
      const stepIndex = workflow.steps.findIndex(step => step.id === stepId)
      if (stepIndex !== -1) {
        workflow.steps[stepIndex] = {
          ...workflow.steps[stepIndex],
          ...stepData
        }
        workflow.updatedAt = new Date().toISOString()
        saveToStorage()
        return workflow.steps[stepIndex]
      }
    }
    return null
  }
  
  const deleteStep = (workflowId, stepId) => {
    const workflow = getWorkflow(workflowId)
    if (workflow) {
      const stepIndex = workflow.steps.findIndex(step => step.id === stepId)
      if (stepIndex !== -1) {
        workflow.steps.splice(stepIndex, 1)
        workflow.updatedAt = new Date().toISOString()
        saveToStorage()
        return true
      }
    }
    return false
  }
  
  const moveStep = (workflowId, stepId, direction) => {
    const workflow = getWorkflow(workflowId)
    if (workflow) {
      const stepIndex = workflow.steps.findIndex(step => step.id === stepId)
      if (stepIndex !== -1) {
        const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1
        if (newIndex >= 0 && newIndex < workflow.steps.length) {
          const step = workflow.steps.splice(stepIndex, 1)[0]
          workflow.steps.splice(newIndex, 0, step)
          workflow.updatedAt = new Date().toISOString()
          saveToStorage()
          return true
        }
      }
    }
    return false
  }
  
  // 执行历史管理
  const getExecutionHistory = (workflowId = null) => {
    if (workflowId) {
      return executionHistory.value.filter(exec => exec.workflowId === workflowId)
    }
    return executionHistory.value
  }
  
  const clearExecutionHistory = (workflowId = null) => {
    if (workflowId) {
      executionHistory.value = executionHistory.value.filter(exec => exec.workflowId !== workflowId)
    } else {
      executionHistory.value = []
    }
    saveToStorage()
  }
  
  // 导入导出
  const exportWorkflow = (id) => {
    const workflow = getWorkflow(id)
    if (workflow) {
      return {
        ...workflow,
        exportedAt: new Date().toISOString()
      }
    }
    return null
  }
  
  const importWorkflow = (workflowData) => {
    const newWorkflow = {
      ...workflowData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    workflows.value.push(newWorkflow)
    saveToStorage()
    return newWorkflow
  }
  
  // 工具函数
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  const loadWorkflows = () => {
    loadFromStorage()
  }
  
  return {
    // 状态
    workflows,
    activeWorkflow,
    executionHistory,
    
    // 计算属性
    sortedWorkflows,
    
    // 方法
    loadWorkflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    getWorkflow,
    duplicateWorkflow,
    executeWorkflow,
    addStep,
    updateStep,
    deleteStep,
    moveStep,
    getExecutionHistory,
    clearExecutionHistory,
    exportWorkflow,
    importWorkflow
  }
}) 