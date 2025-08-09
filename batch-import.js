#!/usr/bin/env node

/**
 * 批量导入命令脚本
 * 使用方法: node batch-import.js [json文件路径]
 */

const fs = require('fs');
const path = require('path');

// 预定义的命令模板
const commandTemplates = {
  git: [
    {
      name: 'Git 初始化仓库',
      command: 'git init',
      description: '在当前目录初始化Git仓库',
      tags: ['git', 'init', '初始化']
    },
    {
      name: 'Git 克隆仓库',
      command: 'git clone {{url}}',
      description: '从远程仓库克隆代码',
      tags: ['git', 'clone', '克隆'],
      parameters: [
        { name: 'url', description: '仓库地址', required: true, defaultValue: '' }
      ]
    },
    {
      name: 'Git 查看分支',
      command: 'git branch -a',
      description: '查看所有分支（本地和远程）',
      tags: ['git', 'branch', '分支']
    },
    {
      name: 'Git 切换分支',
      command: 'git checkout {{branch}}',
      description: '切换到指定分支',
      tags: ['git', 'checkout', '切换'],
      parameters: [
        { name: 'branch', description: '分支名称', required: true, defaultValue: '' }
      ]
    },
    {
      name: 'Git 创建分支',
      command: 'git checkout -b {{branch}}',
      description: '创建并切换到新分支',
      tags: ['git', 'branch', '创建'],
      parameters: [
        { name: 'branch', description: '新分支名称', required: true, defaultValue: '' }
      ]
    },
    {
      name: 'Git 合并分支',
      command: 'git merge {{branch}}',
      description: '将指定分支合并到当前分支',
      tags: ['git', 'merge', '合并'],
      parameters: [
        { name: 'branch', description: '要合并的分支', required: true, defaultValue: '' }
      ]
    },
    {
      name: 'Git 查看日志',
      command: 'git log --oneline -{{count}}',
      description: '查看最近的提交日志',
      tags: ['git', 'log', '日志'],
      parameters: [
        { name: 'count', description: '显示条数', required: false, defaultValue: '10' }
      ]
    }
  ],
  
  docker: [
    {
      name: 'Docker 查看镜像',
      command: 'docker images',
      description: '列出所有Docker镜像',
      tags: ['docker', 'images', '镜像']
    },
    {
      name: 'Docker 拉取镜像',
      command: 'docker pull {{image}}',
      description: '从Docker Hub拉取镜像',
      tags: ['docker', 'pull', '拉取'],
      parameters: [
        { name: 'image', description: '镜像名称', required: true, defaultValue: '' }
      ]
    },
    {
      name: 'Docker 构建镜像',
      command: 'docker build -t {{tag}} {{path}}',
      description: '从Dockerfile构建镜像',
      tags: ['docker', 'build', '构建'],
      parameters: [
        { name: 'tag', description: '镜像标签', required: true, defaultValue: '' },
        { name: 'path', description: 'Dockerfile路径', required: false, defaultValue: '.' }
      ]
    },
    {
      name: 'Docker 删除容器',
      command: 'docker rm {{container}}',
      description: '删除指定容器',
      tags: ['docker', 'remove', '删除'],
      parameters: [
        { name: 'container', description: '容器名称或ID', required: true, defaultValue: '' }
      ]
    },
    {
      name: 'Docker 查看日志',
      command: 'docker logs {{container}}',
      description: '查看容器日志',
      tags: ['docker', 'logs', '日志'],
      parameters: [
        { name: 'container', description: '容器名称或ID', required: true, defaultValue: '' }
      ]
    }
  ],
  
  npm: [
    {
      name: 'NPM 初始化项目',
      command: 'npm init -y',
      description: '快速初始化npm项目',
      tags: ['npm', 'init', '初始化']
    },
    {
      name: 'NPM 安装所有依赖',
      command: 'npm install',
      description: '安装package.json中的所有依赖',
      tags: ['npm', 'install', '依赖']
    },
    {
      name: 'NPM 卸载包',
      command: 'npm uninstall {{package}}',
      description: '卸载指定的NPM包',
      tags: ['npm', 'uninstall', '卸载'],
      parameters: [
        { name: 'package', description: '包名称', required: true, defaultValue: '' }
      ]
    },
    {
      name: 'NPM 查看包信息',
      command: 'npm info {{package}}',
      description: '查看NPM包的详细信息',
      tags: ['npm', 'info', '信息'],
      parameters: [
        { name: 'package', description: '包名称', required: true, defaultValue: '' }
      ]
    },
    {
      name: 'NPM 更新包',
      command: 'npm update {{package}}',
      description: '更新指定的NPM包',
      tags: ['npm', 'update', '更新'],
      parameters: [
        { name: 'package', description: '包名称', required: false, defaultValue: '' }
      ]
    }
  ],
  
  system: [
    {
      name: '查看系统信息',
      command: 'systeminfo',
      description: '显示系统配置信息',
      tags: ['system', 'info', '信息']
    },
    {
      name: '查看磁盘空间',
      command: 'dir {{path}} /-c',
      description: '查看指定路径的磁盘使用情况',
      tags: ['system', 'disk', '磁盘'],
      parameters: [
        { name: 'path', description: '路径', required: false, defaultValue: 'C:\\' }
      ]
    },
    {
      name: '创建目录',
      command: 'mkdir {{dirname}}',
      description: '创建新目录',
      tags: ['system', 'mkdir', '目录'],
      parameters: [
        { name: 'dirname', description: '目录名称', required: true, defaultValue: '' }
      ]
    },
    {
      name: '复制文件',
      command: 'copy "{{source}}" "{{destination}}"',
      description: '复制文件到指定位置',
      tags: ['system', 'copy', '复制'],
      parameters: [
        { name: 'source', description: '源文件路径', required: true, defaultValue: '' },
        { name: 'destination', description: '目标路径', required: true, defaultValue: '' }
      ]
    }
  ],
  
  network: [
    {
      name: '查看网络配置',
      command: 'ipconfig /all',
      description: '显示详细的网络配置信息',
      tags: ['network', 'config', '配置']
    },
    {
      name: '刷新DNS缓存',
      command: 'ipconfig /flushdns',
      description: '清除DNS解析器缓存',
      tags: ['network', 'dns', '缓存']
    },
    {
      name: '追踪路由',
      command: 'tracert {{host}}',
      description: '追踪到目标主机的网络路径',
      tags: ['network', 'trace', '路由'],
      parameters: [
        { name: 'host', description: '目标主机', required: true, defaultValue: 'google.com' }
      ]
    },
    {
      name: '查看网络连接',
      command: 'netstat -an',
      description: '显示所有网络连接和监听端口',
      tags: ['network', 'connection', '连接']
    }
  ]
};

// 生成完整的命令数据
function generateCommands() {
  const commands = [];
  let id = 1;
  
  Object.entries(commandTemplates).forEach(([category, templates]) => {
    templates.forEach(template => {
      commands.push({
        id: `cmd_${id++}`,
        name: template.name,
        command: template.command,
        description: template.description,
        category: category,
        tags: template.tags,
        parameters: template.parameters || []
      });
    });
  });
  
  return commands;
}

// 生成导入数据文件
function generateImportData() {
  return {
    commands: generateCommands(),
    categories: [
      { id: 'git', name: 'Git', color: '#f14e32' },
      { id: 'docker', name: 'Docker', color: '#2496ed' },
      { id: 'npm', name: 'NPM', color: '#cb3837' },
      { id: 'system', name: '系统命令', color: '#28a745' },
      { id: 'database', name: '数据库', color: '#336791' },
      { id: 'network', name: '网络工具', color: '#ff6b35' }
    ],
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const outputFile = args[0] || 'batch-commands.json';
  
  console.log('🚀 开始生成批量命令数据...');
  
  const data = generateImportData();
  
  try {
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ 成功生成 ${data.commands.length} 个命令到文件: ${outputFile}`);
    console.log('\n📋 命令统计:');
    
    Object.entries(commandTemplates).forEach(([category, templates]) => {
      console.log(`  - ${category}: ${templates.length} 个命令`);
    });
    
    console.log('\n💡 使用方法:');
    console.log('1. 在命令手册插件中点击"设置" → "导入数据"');
    console.log(`2. 选择生成的文件: ${outputFile}`);
    console.log('3. 确认导入即可');
    
  } catch (error) {
    console.error('❌ 生成文件失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { generateCommands, generateImportData }; 