# MEMORY.md — Long-Term Memory (Curated)

## Role /职责（老大对伊娃的长期定位）
- 我（伊娃）的核心身份：老大的专职私人助理秘书（不再以 coding/写代码为主要工作输出）。
- 核心职责：
  1) 出谋划策：针对目标、选择、风险、资源与时间做高质量方案比较与决策建议。
  2) 高智商贴心顾问：主动发现问题与机会，给出可执行的下一步；沟通上简洁、专业、可靠。
  3) 连续性管理：把对话与项目进展做归纳整理，写入各自 memory（按对象/会话分开），便于复盘。
  4) 自动运维：每天 07:00 (GMT) 检查 OpenClaw 更新与 AI 情报扫描；07:30 (GMT) 备份所有 Agents 的重要数据（尤其 *.md 文件）。
  5) OpenClaw 变更跟踪：每天 07:00 查看并总结 https://github.com/openclaw/openclaw 最重要的提交与变更。
  6) 全球 AI 每日情报：每天 07:00 进行广域搜索（动态来源、去重、按影响力排序），总结最新 AI 行业情报。
  7) GitHub 趋势扫描：每天 12:00 扫描 GitHub 爆火或高关注度项目，发送中午总结报告。
  8) 每日晨报：每天早上 07:45（GMT/Europe-London）在 Telegram 私聊发送“详细清单式”汇报。

## 环境能力（Environment Capabilities）
- **Docker 支持**：已配置并成功实测，支持通过 `docker run --rm -v $(pwd):/app -w /app python:3.11-slim` 模式运行隔离的子任务脚本。详细信息已录入 `TOOLS.md`。
- **子智能体强化**：已解禁 `sessions_spawn` 附件功能（`tools.sessions_spawn.attachments.enabled: true`），允许派生子任务时携带文件附件。

## OpenClaw 配置约定（避免 workspace 混淆）
- main agent 的 workspace 固定为：/home/ubuntu/.openclaw/workspace
- eva agent 的 workspace 固定为：/home/ubuntu/.openclaw/workspace-eva
- 映射配置位于：~/.openclaw/openclaw.json（agents.defaults.workspace 与 agents.list[*].workspace）
- 定时任务（03:00/04:00/06:00）以 main 的 workspace 作为工作目录

## Working Preferences（老大偏好）
- 喜欢明确、专业的协作节奏；偏好系统性思考与方案对比；希望细致深入。

## 最近记录 (2026-03-08)
- 04:00 — 今日 GitHub 变更跟踪完成。关键变更包括：Dashboard 发送者标签修复、Discord agentComponents 配置增强、Telegram DM 草稿流恢复、Exec Resolver 超时测试稳定、多项 CI 回归修复、Voice Call 和 Gateway 重构。
- 完成每日 GitHub 摘要记录写入 `memory/2026-03-08.md`。

## 最近记录 (2026-03-14)
- 07:00 — 今日 GitHub 变更跟踪与全球 AI 情报扫描完成。关键变更包括：OpenClaw 升级至 2026.3.13，修复 Mattermost 线程上下文传递，CI 隔离 Cron 心跳交付测试，强化速率限制故障转移 (Failover)。AI 情报涉及：AMD 发布 Ryzen AI 400 系列处理器、OpenAI 成立科学 AI 团队、推理模型 (Reasoning models) 成为高性能解决问题的新范式。
- 07:30 — 每日备份已完成。备份报告已生成。
- 07:45 — 每日晨报已成功发送至 Telegram。
- 完成每日记录写入 `memory/2026-03-14.md`。

## 最近记录 (2026-03-13)
- 07:00 — 今日 GitHub 变更总结与全球 AI 情报扫描完成。OpenClaw 升级至 2026.3.12。关键变更：Cron/Doctor 强化、ACP 溯源元数据、Android 唤醒流优化。AI 情报涉及：Apple Siri 重塑、医疗 AI 突破、字节跳动芯片进展。
- 07:30 — 每日备份已完成。所有 `*.md` 与核心配置已归档。

## 最近记录 (2026-03-12)
- 03:00 — 夜间备份已完成。所有 `*.md` 与核心配置已归档至 `backups/2026-03-12/`。
- 04:00 — 今日 GitHub 变更摘要完成。OpenClaw 版本升至 2026.3.10。
- 关键变更：
  1. **版本更新**：版本号更新为 2026.3.10 (0e397e6)。
  2. **新功能**：Gateway 状态现在会显示运行时版本 (5ca780f)；Memory 新增多模态（图像和音频）索引支持 (d79ca52, da6f97a)；OpenRouter 新增免费 Hunter 和 Healer 模型支持 (ade7481)。
  3. **修复与增强**：修复了 ACP 重启后的会话恢复问题 (5231277)；强化了 Discord 消息反应的权限过滤 (487a3ba)；修复了沙盒文件写入的路径锚定问题 (e95f2dc)。

## 最近记录 (2026-03-11)
- 04:00 — 今日 GitHub 变更摘要完成。这是一次重大的安全强化更新，由 Peter Steinberger 提交了多项安全修复。
- 关键变更：
  1. **安全性增强**：实施了分阶段写入和文件系统变更锁定 (a0d5462)；将 `system.run` 审批绑定到精确的参数文本 (7289c19)；强制执行目标账户配置写入策略 (8eac939)；限制子智能体的控制范围 (ecdbd8a)。
  2. **故障弱化处理 (Fail-Closed)**：对于未解析的本地网关认证密钥引用 (SecretRefs)，现在会默认失败锁定以确保安全 (0125ce1)。
  3. **功能拆分**：网关的对话重置现已从管理员重置功能中独立出来 (c91d162)。
- 02:00 / 03:00 — 夜间备份已完成。所有 `*.md` 与核心配置已归档至 `backups/2026-03-11/`。
- **问题记录**：晨报发送至 Telegram (heartbeat channel) 失败，原因是 Chat ID 无法解析。系统自动化运维（升级检查、情报扫描、备份）本身运行正常，但推送链路需要老大提供或修正正确的 Telegram numeric Chat ID。
- **版本预警**：当前版本 2026.3.8 存在已知 Issue #43453，可能导致 Cron 任务无法正常生成运行记录。需关注后续修复版本。

## 最近记录 (2026-03-10)
- 04:00 — 今日 GitHub 变更摘要完成。关键变更：为 Bug 报告表单添加了 Provider 路由详情 (#41712)。
- 02:00 / 03:00 — 夜间备份已完成。所有 `*.md` 与核心配置已归档至 `backups/2026-03-10/`。
- 02:30 — OpenClaw 2026.3.8 自动升级成功（Gateway 与 Node 同步）。
- 04:00 — 今日 GitHub 变更跟踪完成。关键变更：启动 Dashboard-v2 聊天基础模块；显著增强 ACP (Agent Control Protocol) 的附件转发与后续操作可靠性；修复一键退出挂起（内存管理优化）；Discord/Telegram 细节优化。
- 完成每日 GitHub 摘要记录写入 `memory/2026-03-10.md`。

## 最近记录 (2026-03-09)
- 04:00 — 今日 GitHub 变更跟踪与全球 AI 情报扫描完成。关键变更包括：修复安全检查失败、优化 Docker 构建缓存、修复 Gateway 控制界面 404、解决 Telegram 轮询挂起（超时机制）、强化 restrictive 配置文件下的工具暴露，以及对模型与插件系统的多项重构。AI 情报涉及：MIT 可解释性模型突破、Humanity's Last Exam 新基准发布，以及英国 AI 监管政策转向。
- 完成每日 GitHub 摘要与 AI 情报记录写入 `memory/2026-03-09.md`。
