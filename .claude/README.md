# Claude Code Configuration - OpenAI Realtime Agents

## 🚀 Quick Start

This project has been configured with Claude Code for enhanced AI-assisted development.

### Available Commands

```bash
# Development
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run linting
npm start         # Start production server

# Claude Code Commands (run in Claude Code)
/help                    # Show all available commands
/agent/explore          # Explore and map the codebase
/agent/optimize         # Optimize performance
/agent/security         # Run security audit
/agent/test            # Create and run tests
```

## 📁 Project Structure

```
.claude/
├── settings.local.json    # Project-specific settings
├── project-info.json      # Detected project information
├── agent-tasks.json       # Sub-agent task configurations
├── hooks-config.json      # Hook configurations
└── README.md             # This file

CLAUDE.md                  # Project context for Claude
```

## 🤖 Sub-Agent Tasks

### Exploration
```bash
# In Claude Code, run:
/agent/parallel-explore
```
Maps your entire codebase structure, components, and dependencies.

### Feature Implementation
```bash
# In Claude Code:
/agent/implement-feature "Feature description"
```
Implements new features with proper architecture and testing.

### Performance Optimization
```bash
# In Claude Code:
/agent/optimize-performance
```
Analyzes and optimizes bundle size, loading times, and rendering.

### Security Audit
```bash
# In Claude Code:
/agent/security-audit
```
Checks for vulnerabilities and security best practices.

## 🪝 Hooks

The following hooks are configured:

- **pre-edit**: Validates file permissions
- **post-edit**: Auto-lints TypeScript/TSX files
- **pre-commit**: Runs lint and build checks
- **pre-build**: Clears cache and runs lint
- **post-build**: Reports build size
- **session-start**: Shows project status

## 🔧 Configuration

### Settings
Edit `.claude/settings.local.json` to customize:
- Commands and scripts
- Agent behaviors
- Hook configurations
- Monitoring settings

### Project Context
Update `CLAUDE.md` with:
- Project-specific instructions
- Coding standards
- Architecture decisions
- Important notes

## 📊 Monitoring

### View Metrics
```bash
~/.claude/scripts/monitor-agents.py
```

### Check Logs
```bash
tail -f .claude/logs/hooks.log
```

## 🎯 Workflows

### New Feature Development
1. Explore codebase: `/agent/explore`
2. Implement feature: `/agent/implement-feature`
3. Add tests: `/agent/test`
4. Document: `/agent/documentation`

### Production Preparation
1. Security audit: `/agent/security-audit`
2. Optimize: `/agent/optimize-performance`
3. Test coverage: `/agent/test-coverage`
4. Deploy prep: `/agent/deployment-prep`

### AI Enhancement
1. Explore: `/agent/explore`
2. AI integration: `/agent/ai-integration`
3. Data pipeline: `/agent/data-pipeline`
4. Testing: `/agent/test`

## 🛠️ Troubleshooting

### Common Issues

1. **Hooks not running**: Check `.claude/hooks-config.json`
2. **Agent timeout**: Adjust timeout in `settings.local.json`
3. **Permission errors**: Ensure proper file permissions

### Reset Configuration
```bash
rm -rf .claude/
# Then run /init:setup-all again
```

## 📚 Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Global Configuration](~/.claude/README.md)
- [Sub-Agents Guide](~/.claude/SUB_AGENTS_GUIDE.md)
- [Hooks Guide](~/.claude/HOOKS_GUIDE.md)

## 💡 Tips

1. Use parallel agents for faster exploration
2. Enable hooks for automatic code quality checks
3. Customize agent tasks for your workflow
4. Monitor long-running tasks with the monitor script
5. Keep CLAUDE.md updated with project changes

---

*Configuration created for OpenAI Realtime Agents project*
*Next.js 15 + TypeScript + OpenAI Agents SDK*