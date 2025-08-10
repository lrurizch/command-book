/**
 * 完整的Git命令模板
 * 包含Git的所有常用命令、子命令、选项和参数
 */

import { ParameterType, DataType } from '../utils/universalCommandBuilder.js'

export const completeGitTemplate = {
  metadata: {
    id: 'git-complete',
    name: 'Git 完整命令集',
    description: 'Git 分布式版本控制系统的完整命令模板',
    version: '2.42.0',
    category: 'git',
    tags: ['git', 'vcs', '版本控制', 'repository', 'branch', 'commit', 'merge'],
    author: 'System',
    created: new Date('2024-01-01'),
    updated: new Date(),
    license: 'MIT',
    homepage: 'https://git-scm.com',
    repository: 'https://github.com/git/git',
    documentation: 'https://git-scm.com/docs'
  },
  
  command: {
    mainCommand: {
      name: 'git',
      type: 'SYSTEM',
      executable: 'git',
      validation: {
        required: true,
        checkExistence: true
      },
      platform: {
        windows: 'git.exe',
        macos: '/usr/bin/git',
        linux: '/usr/bin/git'
      }
    },
    
    subcommands: [
      // === 基础命令 ===
      {
        name: 'init',
        type: ParameterType.OPTIONAL,
        description: '在当前目录创建新的Git仓库',
        aliases: [],
        group: 'basic',
        examples: ['git init', 'git init my-project']
      },
      {
        name: 'clone',
        type: ParameterType.OPTIONAL,
        description: '克隆远程仓库到本地',
        aliases: [],
        group: 'basic',
        examples: ['git clone https://github.com/user/repo.git']
      },
      {
        name: 'add',
        type: ParameterType.OPTIONAL,
        description: '添加文件到暂存区',
        aliases: [],
        group: 'basic',
        examples: ['git add .', 'git add file.txt']
      },
      {
        name: 'commit',
        type: ParameterType.OPTIONAL,
        description: '提交暂存区的更改',
        aliases: [],
        group: 'basic',
        examples: ['git commit -m "feat: add new feature"']
      },
      {
        name: 'status',
        type: ParameterType.OPTIONAL,
        description: '显示工作目录状态',
        aliases: [],
        group: 'basic',
        examples: ['git status', 'git status -s']
      },
      {
        name: 'log',
        type: ParameterType.OPTIONAL,
        description: '显示提交历史',
        aliases: [],
        group: 'basic',
        examples: ['git log', 'git log --oneline']
      },
      {
        name: 'diff',
        type: ParameterType.OPTIONAL,
        description: '显示更改差异',
        aliases: [],
        group: 'basic',
        examples: ['git diff', 'git diff --cached']
      },

      // === 分支操作 ===
      {
        name: 'branch',
        type: ParameterType.OPTIONAL,
        description: '分支管理',
        aliases: [],
        group: 'branch',
        examples: ['git branch', 'git branch new-feature']
      },
      {
        name: 'checkout',
        type: ParameterType.OPTIONAL,
        description: '切换分支或恢复文件',
        aliases: [],
        group: 'branch',
        examples: ['git checkout main', 'git checkout -b new-branch']
      },
      {
        name: 'switch',
        type: ParameterType.OPTIONAL,
        description: '切换分支（新命令）',
        aliases: [],
        group: 'branch',
        examples: ['git switch main', 'git switch -c new-branch']
      },
      {
        name: 'merge',
        type: ParameterType.OPTIONAL,
        description: '合并分支',
        aliases: [],
        group: 'branch',
        examples: ['git merge feature-branch']
      },
      {
        name: 'rebase',
        type: ParameterType.OPTIONAL,
        description: '变基操作',
        aliases: [],
        group: 'branch',
        examples: ['git rebase main', 'git rebase -i HEAD~3']
      },

      // === 远程操作 ===
      {
        name: 'remote',
        type: ParameterType.OPTIONAL,
        description: '管理远程仓库',
        aliases: [],
        group: 'remote',
        examples: ['git remote -v', 'git remote add origin <url>']
      },
      {
        name: 'fetch',
        type: ParameterType.OPTIONAL,
        description: '从远程仓库获取更新',
        aliases: [],
        group: 'remote',
        examples: ['git fetch origin']
      },
      {
        name: 'pull',
        type: ParameterType.OPTIONAL,
        description: '拉取并合并远程更改',
        aliases: [],
        group: 'remote',
        examples: ['git pull origin main']
      },
      {
        name: 'push',
        type: ParameterType.OPTIONAL,
        description: '推送到远程仓库',
        aliases: [],
        group: 'remote',
        examples: ['git push origin main', 'git push -u origin main']
      },

      // === 撤销操作 ===
      {
        name: 'reset',
        type: ParameterType.OPTIONAL,
        description: '重置到指定状态',
        aliases: [],
        group: 'undo',
        examples: ['git reset --hard HEAD~1', 'git reset --soft HEAD~1']
      },
      {
        name: 'revert',
        type: ParameterType.OPTIONAL,
        description: '撤销指定提交',
        aliases: [],
        group: 'undo',
        examples: ['git revert HEAD', 'git revert <commit-hash>']
      },
      {
        name: 'restore',
        type: ParameterType.OPTIONAL,
        description: '恢复工作目录文件',
        aliases: [],
        group: 'undo',
        examples: ['git restore file.txt', 'git restore --staged file.txt']
      },

      // === 存储操作 ===
      {
        name: 'stash',
        type: ParameterType.OPTIONAL,
        description: '暂存当前更改',
        aliases: [],
        group: 'stash',
        examples: ['git stash', 'git stash pop']
      },

      // === 标签操作 ===
      {
        name: 'tag',
        type: ParameterType.OPTIONAL,
        description: '标签管理',
        aliases: [],
        group: 'tag',
        examples: ['git tag v1.0.0', 'git tag -a v1.0.0 -m "Release v1.0.0"']
      },

      // === 配置操作 ===
      {
        name: 'config',
        type: ParameterType.OPTIONAL,
        description: 'Git配置管理',
        aliases: [],
        group: 'config',
        examples: ['git config --global user.name "Your Name"']
      },

      // === 清理操作 ===
      {
        name: 'clean',
        type: ParameterType.OPTIONAL,
        description: '清理未跟踪的文件',
        aliases: [],
        group: 'clean',
        examples: ['git clean -fd']
      },

      // === 其他操作 ===
      {
        name: 'show',
        type: ParameterType.OPTIONAL,
        description: '显示对象信息',
        aliases: [],
        group: 'info',
        examples: ['git show HEAD', 'git show <commit-hash>']
      },
      {
        name: 'blame',
        type: ParameterType.OPTIONAL,
        description: '显示文件每行的最后修改信息',
        aliases: [],
        group: 'info',
        examples: ['git blame file.txt']
      },
      {
        name: 'grep',
        type: ParameterType.OPTIONAL,
        description: '在仓库中搜索文本',
        aliases: [],
        group: 'search',
        examples: ['git grep "pattern"']
      },
      {
        name: 'cherry-pick',
        type: ParameterType.OPTIONAL,
        description: '选择性应用提交',
        aliases: [],
        group: 'advanced',
        examples: ['git cherry-pick <commit-hash>']
      },
      {
        name: 'reflog',
        type: ParameterType.OPTIONAL,
        description: '显示引用日志',
        aliases: [],
        group: 'advanced',
        examples: ['git reflog']
      },
      {
        name: 'bisect',
        type: ParameterType.OPTIONAL,
        description: '二分查找问题提交',
        aliases: [],
        group: 'advanced',
        examples: ['git bisect start', 'git bisect good', 'git bisect bad']
      },
      {
        name: 'submodule',
        type: ParameterType.OPTIONAL,
        description: '子模块管理',
        aliases: [],
        group: 'advanced',
        examples: ['git submodule add <url>', 'git submodule update --init']
      },
      {
        name: 'worktree',
        type: ParameterType.OPTIONAL,
        description: '工作树管理',
        aliases: [],
        group: 'advanced',
        examples: ['git worktree add ../feature feature-branch']
      }
    ],
    
    parameters: [
      {
        name: 'repository',
        type: ParameterType.OPTIONAL,
        dataType: DataType.URL,
        description: '仓库URL或路径',
        placeholder: 'https://github.com/user/repo.git',
        position: 0,
        conditional: {
          enabledWhen: ['clone']
        }
      },
      {
        name: 'directory',
        type: ParameterType.OPTIONAL,
        dataType: DataType.STRING,
        description: '目标目录名',
        placeholder: 'project-name',
        position: 1,
        conditional: {
          enabledWhen: ['clone', 'init']
        }
      },
      {
        name: 'files',
        type: ParameterType.OPTIONAL,
        dataType: DataType.ARRAY,
        description: '文件或目录路径',
        placeholder: '文件路径...',
        position: 0,
        repeatable: true,
        conditional: {
          enabledWhen: ['add', 'checkout', 'restore', 'rm']
        }
      },
      {
        name: 'branch',
        type: ParameterType.OPTIONAL,
        dataType: DataType.STRING,
        description: '分支名称',
        placeholder: 'branch-name',
        position: 0,
        conditional: {
          enabledWhen: ['branch', 'checkout', 'switch', 'merge', 'rebase']
        }
      },
      {
        name: 'commit',
        type: ParameterType.OPTIONAL,
        dataType: DataType.STRING,
        description: '提交哈希或引用',
        placeholder: 'commit-hash 或 HEAD~1',
        position: 0,
        conditional: {
          enabledWhen: ['show', 'reset', 'revert', 'cherry-pick']
        }
      },
      {
        name: 'remote',
        type: ParameterType.OPTIONAL,
        dataType: DataType.STRING,
        description: '远程仓库名称',
        placeholder: 'origin',
        position: 0,
        defaultValue: 'origin',
        conditional: {
          enabledWhen: ['remote', 'fetch', 'pull', 'push']
        }
      },
      {
        name: 'tag',
        type: ParameterType.OPTIONAL,
        dataType: DataType.STRING,
        description: '标签名称',
        placeholder: 'v1.0.0',
        position: 0,
        conditional: {
          enabledWhen: ['tag']
        }
      },
      {
        name: 'config-key',
        type: ParameterType.OPTIONAL,
        dataType: DataType.STRING,
        description: '配置键名',
        placeholder: 'user.name',
        position: 0,
        conditional: {
          enabledWhen: ['config']
        }
      },
      {
        name: 'config-value',
        type: ParameterType.OPTIONAL,
        dataType: DataType.STRING,
        description: '配置值',
        placeholder: '"Your Name"',
        position: 1,
        conditional: {
          enabledWhen: ['config']
        }
      }
    ],
    
    options: [
      // === 全局选项 ===
      {
        name: 'help',
        shortFlag: '-h',
        longFlag: '--help',
        type: ParameterType.OPTIONAL,
        description: '显示帮助信息',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        global: true
      },
      {
        name: 'version',
        shortFlag: '',
        longFlag: '--version',
        type: ParameterType.OPTIONAL,
        description: '显示Git版本',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        global: true
      },

      // === init 命令选项 ===
      {
        name: 'bare',
        shortFlag: '',
        longFlag: '--bare',
        type: ParameterType.OPTIONAL,
        description: '创建裸仓库',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['init']
        }
      },
      {
        name: 'template',
        shortFlag: '',
        longFlag: '--template',
        type: ParameterType.OPTIONAL,
        description: '指定模板目录',
        parameter: {
          required: true,
          dataType: DataType.DIRECTORY
        },
        conditional: {
          enabledWhen: ['init']
        }
      },

      // === clone 命令选项 ===
      {
        name: 'clone-branch',
        shortFlag: '-b',
        longFlag: '--branch',
        type: ParameterType.OPTIONAL,
        description: '指定要克隆的分支',
        parameter: {
          required: true,
          dataType: DataType.STRING
        },
        conditional: {
          enabledWhen: ['clone']
        }
      },
      {
        name: 'depth',
        shortFlag: '',
        longFlag: '--depth',
        type: ParameterType.OPTIONAL,
        description: '创建浅克隆，指定历史深度',
        parameter: {
          required: true,
          dataType: DataType.INTEGER,
          placeholder: '1'
        },
        conditional: {
          enabledWhen: ['clone']
        }
      },
      {
        name: 'recursive',
        shortFlag: '',
        longFlag: '--recursive',
        type: ParameterType.OPTIONAL,
        description: '递归克隆子模块',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['clone']
        }
      },
      {
        name: 'single-branch',
        shortFlag: '',
        longFlag: '--single-branch',
        type: ParameterType.OPTIONAL,
        description: '只克隆单个分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['clone']
        }
      },

      // === add 命令选项 ===
      {
        name: 'all',
        shortFlag: '-A',
        longFlag: '--all',
        type: ParameterType.OPTIONAL,
        description: '添加所有更改（包括删除）',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['add']
        }
      },
      {
        name: 'update',
        shortFlag: '-u',
        longFlag: '--update',
        type: ParameterType.OPTIONAL,
        description: '只添加已跟踪文件的更改',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['add']
        }
      },
      {
        name: 'force',
        shortFlag: '-f',
        longFlag: '--force',
        type: ParameterType.OPTIONAL,
        description: '强制添加忽略的文件',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['add', 'push']
        }
      },
      {
        name: 'interactive',
        shortFlag: '-i',
        longFlag: '--interactive',
        type: ParameterType.OPTIONAL,
        description: '交互式添加',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['add', 'rebase']
        }
      },
      {
        name: 'patch',
        shortFlag: '-p',
        longFlag: '--patch',
        type: ParameterType.OPTIONAL,
        description: '交互式选择补丁块',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['add', 'checkout', 'reset']
        }
      },

      // === commit 命令选项 ===
      {
        name: 'message',
        shortFlag: '-m',
        longFlag: '--message',
        type: ParameterType.OPTIONAL,
        description: '提交信息',
        parameter: {
          required: true,
          dataType: DataType.STRING,
          placeholder: '"feat: add new feature"'
        },
        conditional: {
          enabledWhen: ['commit', 'tag']
        }
      },
      {
        name: 'amend',
        shortFlag: '',
        longFlag: '--amend',
        type: ParameterType.OPTIONAL,
        description: '修改最后一次提交',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['commit']
        }
      },
      {
        name: 'no-edit',
        shortFlag: '',
        longFlag: '--no-edit',
        type: ParameterType.OPTIONAL,
        description: '不编辑提交信息',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['commit']
        }
      },
      {
        name: 'author',
        shortFlag: '',
        longFlag: '--author',
        type: ParameterType.OPTIONAL,
        description: '覆盖作者信息',
        parameter: {
          required: true,
          dataType: DataType.STRING,
          placeholder: '"Name <email@example.com>"'
        },
        conditional: {
          enabledWhen: ['commit']
        }
      },
      {
        name: 'date',
        shortFlag: '',
        longFlag: '--date',
        type: ParameterType.OPTIONAL,
        description: '覆盖作者日期',
        parameter: {
          required: true,
          dataType: DataType.STRING,
          placeholder: '"2023-12-25 10:00:00"'
        },
        conditional: {
          enabledWhen: ['commit']
        }
      },
      {
        name: 'allow-empty',
        shortFlag: '',
        longFlag: '--allow-empty',
        type: ParameterType.OPTIONAL,
        description: '允许空提交',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['commit']
        }
      },
      {
        name: 'signoff',
        shortFlag: '-s',
        longFlag: '--signoff',
        type: ParameterType.OPTIONAL,
        description: '添加Signed-off-by行',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['commit']
        }
      },

      // === status 命令选项 ===
      {
        name: 'short',
        shortFlag: '-s',
        longFlag: '--short',
        type: ParameterType.OPTIONAL,
        description: '简短格式输出',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['status']
        }
      },
      {
        name: 'porcelain',
        shortFlag: '',
        longFlag: '--porcelain',
        type: ParameterType.OPTIONAL,
        description: '机器可读格式',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['status']
        }
      },
      {
        name: 'ignored',
        shortFlag: '',
        longFlag: '--ignored',
        type: ParameterType.OPTIONAL,
        description: '显示忽略的文件',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['status']
        }
      },

      // === log 命令选项 ===
      {
        name: 'oneline',
        shortFlag: '',
        longFlag: '--oneline',
        type: ParameterType.OPTIONAL,
        description: '单行显示提交',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['log']
        }
      },
      {
        name: 'graph',
        shortFlag: '',
        longFlag: '--graph',
        type: ParameterType.OPTIONAL,
        description: '显示分支图',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['log']
        }
      },
      {
        name: 'decorate',
        shortFlag: '',
        longFlag: '--decorate',
        type: ParameterType.OPTIONAL,
        description: '显示引用信息',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['log']
        }
      },
      {
        name: 'all',
        shortFlag: '',
        longFlag: '--all',
        type: ParameterType.OPTIONAL,
        description: '显示所有分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['log']
        }
      },
      {
        name: 'since',
        shortFlag: '',
        longFlag: '--since',
        type: ParameterType.OPTIONAL,
        description: '限制日期范围（之后）',
        parameter: {
          required: true,
          dataType: DataType.STRING,
          placeholder: '"2023-01-01"'
        },
        conditional: {
          enabledWhen: ['log']
        }
      },
      {
        name: 'until',
        shortFlag: '',
        longFlag: '--until',
        type: ParameterType.OPTIONAL,
        description: '限制日期范围（之前）',
        parameter: {
          required: true,
          dataType: DataType.STRING,
          placeholder: '"2023-12-31"'
        },
        conditional: {
          enabledWhen: ['log']
        }
      },
      {
        name: 'max-count',
        shortFlag: '-n',
        longFlag: '--max-count',
        type: ParameterType.OPTIONAL,
        description: '限制显示的提交数量',
        parameter: {
          required: true,
          dataType: DataType.INTEGER,
          placeholder: '10'
        },
        conditional: {
          enabledWhen: ['log']
        }
      },

      // === diff 命令选项 ===
      {
        name: 'cached',
        shortFlag: '',
        longFlag: '--cached',
        type: ParameterType.OPTIONAL,
        description: '显示暂存区与HEAD的差异',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['diff']
        }
      },
      {
        name: 'staged',
        shortFlag: '',
        longFlag: '--staged',
        type: ParameterType.OPTIONAL,
        description: '显示暂存区的差异（同--cached）',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['diff']
        }
      },
      {
        name: 'name-only',
        shortFlag: '',
        longFlag: '--name-only',
        type: ParameterType.OPTIONAL,
        description: '只显示文件名',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['diff']
        }
      },
      {
        name: 'stat',
        shortFlag: '',
        longFlag: '--stat',
        type: ParameterType.OPTIONAL,
        description: '显示统计信息',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['diff']
        }
      },

      // === branch 命令选项 ===
      {
        name: 'list',
        shortFlag: '-l',
        longFlag: '--list',
        type: ParameterType.OPTIONAL,
        description: '列出分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['branch']
        }
      },
      {
        name: 'all-branches',
        shortFlag: '-a',
        longFlag: '--all',
        type: ParameterType.OPTIONAL,
        description: '显示所有分支（本地和远程）',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['branch']
        }
      },
      {
        name: 'remotes',
        shortFlag: '-r',
        longFlag: '--remotes',
        type: ParameterType.OPTIONAL,
        description: '只显示远程分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['branch']
        }
      },
      {
        name: 'delete',
        shortFlag: '-d',
        longFlag: '--delete',
        type: ParameterType.OPTIONAL,
        description: '删除分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['branch']
        }
      },
      {
        name: 'force-delete',
        shortFlag: '-D',
        longFlag: '--delete --force',
        type: ParameterType.OPTIONAL,
        description: '强制删除分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['branch']
        }
      },
      {
        name: 'move',
        shortFlag: '-m',
        longFlag: '--move',
        type: ParameterType.OPTIONAL,
        description: '重命名分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['branch']
        }
      },

      // === checkout 命令选项 ===
      {
        name: 'create-branch',
        shortFlag: '-b',
        longFlag: '',
        type: ParameterType.OPTIONAL,
        description: '创建并切换到新分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['checkout']
        }
      },
      {
        name: 'force-checkout',
        shortFlag: '-f',
        longFlag: '--force',
        type: ParameterType.OPTIONAL,
        description: '强制切换，丢弃本地更改',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['checkout']
        }
      },
      {
        name: 'track',
        shortFlag: '-t',
        longFlag: '--track',
        type: ParameterType.OPTIONAL,
        description: '设置上游跟踪',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['checkout']
        }
      },

      // === switch 命令选项 ===
      {
        name: 'create',
        shortFlag: '-c',
        longFlag: '--create',
        type: ParameterType.OPTIONAL,
        description: '创建新分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['switch']
        }
      },
      {
        name: 'force-create',
        shortFlag: '-C',
        longFlag: '--force-create',
        type: ParameterType.OPTIONAL,
        description: '强制创建分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['switch']
        }
      },

      // === merge 命令选项 ===
      {
        name: 'no-ff',
        shortFlag: '',
        longFlag: '--no-ff',
        type: ParameterType.OPTIONAL,
        description: '不使用快进合并',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['merge']
        }
      },
      {
        name: 'squash',
        shortFlag: '',
        longFlag: '--squash',
        type: ParameterType.OPTIONAL,
        description: '压缩合并',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['merge']
        }
      },
      {
        name: 'no-commit',
        shortFlag: '',
        longFlag: '--no-commit',
        type: ParameterType.OPTIONAL,
        description: '合并但不提交',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['merge']
        }
      },

      // === reset 命令选项 ===
      {
        name: 'soft',
        shortFlag: '',
        longFlag: '--soft',
        type: ParameterType.OPTIONAL,
        description: '软重置（保留暂存区和工作目录）',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['reset']
        }
      },
      {
        name: 'mixed',
        shortFlag: '',
        longFlag: '--mixed',
        type: ParameterType.OPTIONAL,
        description: '混合重置（保留工作目录）',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['reset']
        }
      },
      {
        name: 'hard',
        shortFlag: '',
        longFlag: '--hard',
        type: ParameterType.OPTIONAL,
        description: '硬重置（丢弃所有更改）',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['reset']
        }
      },

      // === push 命令选项 ===
      {
        name: 'set-upstream',
        shortFlag: '-u',
        longFlag: '--set-upstream',
        type: ParameterType.OPTIONAL,
        description: '设置上游分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['push']
        }
      },
      {
        name: 'all-refs',
        shortFlag: '',
        longFlag: '--all',
        type: ParameterType.OPTIONAL,
        description: '推送所有分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['push']
        }
      },
      {
        name: 'tags',
        shortFlag: '',
        longFlag: '--tags',
        type: ParameterType.OPTIONAL,
        description: '推送所有标签',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['push']
        }
      },
      {
        name: 'delete-remote',
        shortFlag: '-d',
        longFlag: '--delete',
        type: ParameterType.OPTIONAL,
        description: '删除远程分支',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['push']
        }
      },

      // === pull 命令选项 ===
      {
        name: 'rebase-pull',
        shortFlag: '-r',
        longFlag: '--rebase',
        type: ParameterType.OPTIONAL,
        description: '使用变基而不是合并',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['pull']
        }
      },
      {
        name: 'no-rebase',
        shortFlag: '',
        longFlag: '--no-rebase',
        type: ParameterType.OPTIONAL,
        description: '不使用变基',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['pull']
        }
      },

      // === stash 命令选项 ===
      {
        name: 'include-untracked',
        shortFlag: '-u',
        longFlag: '--include-untracked',
        type: ParameterType.OPTIONAL,
        description: '包含未跟踪的文件',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['stash']
        }
      },
      {
        name: 'all-files',
        shortFlag: '-a',
        longFlag: '--all',
        type: ParameterType.OPTIONAL,
        description: '包含所有文件（包括忽略的）',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['stash']
        }
      },

      // === tag 命令选项 ===
      {
        name: 'annotate',
        shortFlag: '-a',
        longFlag: '--annotate',
        type: ParameterType.OPTIONAL,
        description: '创建注释标签',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['tag']
        }
      },
      {
        name: 'lightweight',
        shortFlag: '',
        longFlag: '--lightweight',
        type: ParameterType.OPTIONAL,
        description: '创建轻量标签',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['tag']
        }
      },
      {
        name: 'delete-tag',
        shortFlag: '-d',
        longFlag: '--delete',
        type: ParameterType.OPTIONAL,
        description: '删除标签',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['tag']
        }
      },

      // === config 命令选项 ===
      {
        name: 'global',
        shortFlag: '',
        longFlag: '--global',
        type: ParameterType.OPTIONAL,
        description: '全局配置',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['config']
        }
      },
      {
        name: 'system',
        shortFlag: '',
        longFlag: '--system',
        type: ParameterType.OPTIONAL,
        description: '系统级配置',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['config']
        }
      },
      {
        name: 'local',
        shortFlag: '',
        longFlag: '--local',
        type: ParameterType.OPTIONAL,
        description: '本地仓库配置',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['config']
        }
      },
      {
        name: 'list-config',
        shortFlag: '-l',
        longFlag: '--list',
        type: ParameterType.OPTIONAL,
        description: '列出所有配置',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['config']
        }
      },
      {
        name: 'get',
        shortFlag: '',
        longFlag: '--get',
        type: ParameterType.OPTIONAL,
        description: '获取配置值',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['config']
        }
      },
      {
        name: 'unset',
        shortFlag: '',
        longFlag: '--unset',
        type: ParameterType.OPTIONAL,
        description: '删除配置',
        parameter: {
          required: false,
          dataType: DataType.BOOLEAN
        },
        conditional: {
          enabledWhen: ['config']
        }
      }
    ]
  },
  
  buildConfig: {
    outputFormat: {
      template: '{{mainCommand}} {{subcommands}} {{options}} {{parameters}}',
      escaping: 'smart',
      quoting: 'auto',
      platform: 'cross'
    },
    validation: {
      syntax: true,
      semantics: true,
      safety: false,
      compatibility: true
    },
    generation: {
      includeComments: false,
      formatStyle: 'compact',
      verbosity: 'normal',
      dryRun: false
    }
  }
}

export default completeGitTemplate 