# Codebase Mapping

**Generated:** <DATE>
**Purpose:** GSD onboarding — map of existing codebase

## 1. Project Overview

- **What it does:** [One sentence]
- **Core value:** [Value proposition]
- **Target users:** [Who uses this]

## 2. Tech Stack

### Language & Framework
| Component | Version | Purpose |
|-----------|---------|---------|
| [language] | [ver] | [primary language] |
| [framework] | [ver] | [web framework, CLI framework, etc.] |

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| [pkg] | [ver] | [what it does] |

### Build & Test
- **Build:** [build command]
- **Test:** [test command]
- **Lint:** [lint command]

## 3. Architecture

### Structure
```
src/
├── [dir]/         # [purpose]
├── [dir]/         # [purpose]
└── [dir]/         # [purpose]
```

### Key Modules
| Module | Path | Responsibility |
|--------|------|----------------|
| [name] | [path] | [what it does] |

### Data Flow
[How data moves through the system — entry points, processing, storage]

### External Integrations
| Service | Purpose | Config Location |
|---------|---------|-----------------|
| [service] | [why] | [where configured] |

## 4. Code Conventions

- **Naming:** [conventions observed]
- **File organization:** [patterns]
- **Import style:** [how imports are structured]
- **Error handling:** [patterns for errors]
- **Testing:** [test patterns]

## 5. Entry Points

| Entry Point | Type | Location |
|-------------|------|----------|
| [name] | [CLI/API/app] | [file:line] |

### Configuration Files
| File | Purpose |
|------|---------|
| [path] | [what it configures] |

## 6. Known Issues & Tech Debt

- [issue/debt item 1]
- [issue/debt item 2]

### TODO/FIXME Markers
| File:Line | Marker | Description |
|-----------|--------|-------------|
| [path:line] | TODO | [what needs doing] |

## 7. Testing

- **Framework:** [test framework]
- **Config:** [config file or command]
- **How to run:** [command]
- **Coverage:** [if determinable]

### Test Structure
```
tests/
├── [dir]/         # [purpose]
└── [dir]/         # [purpose]
```

## 8. Build & Deploy

- **Build command:** [command]
- **Run locally:** [command]
- **Deploy:** [how it's deployed]
- **CI/CD:** [if any]
