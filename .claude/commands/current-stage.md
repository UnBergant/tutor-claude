Analyze the current state of the Celestia project and present a structured status report.

## Instructions

1. Read the key project documents to understand the full scope:
   - `docs/PRODUCT.md` — product vision and MVP roadmap (Phases 1-6)
   - `docs/TECH.md` — technology decisions and architecture
   - `CLAUDE.md` — current codebase description

2. Inspect the actual codebase to determine what has been implemented:
   - Check `package.json` for installed dependencies
   - Check `src/` for actual application code
   - Check `prisma/` for database schema
   - Check for configured tooling (biome, tailwind, next.config, etc.)
   - Run `git log --oneline -20` to see recent development activity
   - Run `git branch -a` to see active branches

3. Cross-reference the MVP Roadmap phases from `docs/PRODUCT.md` against the actual codebase.

4. Present the report in Russian using this format:

```
## 🏗️ Состояние проекта Celestia

### Текущая фаза: [Phase N: Name]

### ✅ Выполнено
- [List completed items with evidence from codebase]

### 🔄 В процессе
- [List items currently being worked on, based on branch activity and partial implementations]

### 📋 Предстоит (следующие шаги)
- [List immediate next tasks within current/next phase]

### 🗺️ Дорожная карта MVP
- Phase 1: Foundation — [status emoji] [one-line summary]
- Phase 2: Assessment Engine — [status emoji] [one-line summary]
- Phase 3: Interactive Exercise Engine — [status emoji] [one-line summary]
- Phase 4: Curriculum & Lessons — [status emoji] [one-line summary]
- Phase 5: Chat with Celestia — [status emoji] [one-line summary]
- Phase 6: Vocabulary & Gamification — [status emoji] [one-line summary]

### 📊 Стек и инфраструктура
- [Current state of tech stack setup vs planned]
```

Use these status indicators:
- ✅ Done
- 🔄 In progress
- ⏳ Not started
- 🟡 Partially done

Be precise — only mark things as done if you see actual code/config, not just docs.

$ARGUMENTS
