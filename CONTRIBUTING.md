# Contributing to Stark Deployer

Thank you for your interest in contributing to Stark Deployer! This guide will help you get set up and walk you through the contribution process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [License](#license)

## Code of Conduct

- Be respectful and constructive in all interactions.
- Welcome newcomers and help them get started.
- Focus on the issue, not the person.
- No harassment, discrimination, or abusive behavior of any kind.

## How Can I Contribute?

### Report Bugs

Found something broken? [Open a bug report](https://github.com/Cycle-Stark/stark-deployer/issues/new?labels=bug) with:

- A clear title describing the issue
- Steps to reproduce the bug
- Expected vs actual behavior
- Browser, wallet, and network information
- Screenshots if applicable

### Request Features

Have an idea? [Open a feature request](https://github.com/Cycle-Stark/stark-deployer/issues/new?labels=enhancement) with:

- A clear description of the feature
- The problem it solves or the use case it addresses
- Any mockups or examples if possible

### Submit Code

Pick up an existing issue or propose a change:

1. Check [open issues](https://github.com/Cycle-Stark/stark-deployer/issues) for something you'd like to work on
2. Comment on the issue to let others know you're working on it
3. Fork, branch, code, and submit a PR (see [Pull Request Process](#pull-request-process))

### Improve Documentation

- Fix typos, clarify instructions, add examples
- No PR is too small

## Development Setup

### Prerequisites

- **Node.js** 20+
- **Yarn** package manager
- A Starknet wallet extension ([Argent X](https://www.argent.xyz/argent-x/), [Braavos](https://braavos.app/), or Keon)

### Installation

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/stark-deployer.git
cd stark-deployer
yarn install
```

### Running Locally

```bash
# Start the dev server
yarn dev

# The app will be available at http://localhost:3000
```

### Optional: Local Devnet

If you want to test against a local Starknet devnet:

```bash
mkdir -p ~/starknet_devnet
starknet-devnet --seed 1350075753 --dump-path ~/starknet_devnet/dump --dump-on exit
```

See the [README](README.md#starknet-devnet-setup) for devnet installation instructions.

## Project Structure

```
├── components/
│   ├── common/          # Shared components (HandyTools, NotesTool, etc.)
│   ├── contracts/       # Contract interaction components
│   ├── landing/         # Landing page sections
│   ├── navigation/      # Sidebar, nav links
│   ├── wallet/          # Wallet connection components
│   └── utils/           # Utility components
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── layouts/             # Page layouts (AppLayout, DefaultMainLayout, etc.)
├── pages/               # Next.js pages
│   ├── app/             # Main application pages
│   └── blog/            # Blog pages
├── providers/           # App-level providers
├── services/            # API/service layer
├── storage/             # Dexie IndexedDB databases and managers
├── styles/              # Global styles and CSS modules
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Key Patterns

- **Storage**: Dexie databases with singleton manager classes (see `storage/` folder)
- **State**: React Context + Valtio for global state, `useLiveQuery` for reactive DB queries
- **UI**: Mantine components throughout — follow existing Mantine patterns and use the theme
- **Layouts**: `AppLayout` for the main app, `DefaultMainLayout` for public pages, `ContractLayout` for contract-specific pages

## Development Workflow

1. **Create a branch** from `master`:

   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following the [coding standards](#coding-standards).

3. **Test your changes**:

   ```bash
   # Type checking
   yarn typecheck

   # Linting
   yarn lint

   # Formatting check
   yarn prettier:check

   # Run all checks
   yarn test

   # Build to verify no compilation errors
   yarn build
   ```

4. **Commit** following the [commit guidelines](#commit-guidelines).

5. **Push** and open a PR.

## Coding Standards

### General

- Use **TypeScript** for all new files
- Follow existing patterns in the codebase — consistency matters more than personal preference
- Keep components focused and reasonably sized
- Use Mantine components and hooks rather than custom CSS where possible

### Naming Conventions

- **Components**: PascalCase (`DeployContract.tsx`)
- **Hooks**: camelCase with `use` prefix (`useContracts.ts`)
- **Utilities**: camelCase (`formatAddress.ts`)
- **Types/Interfaces**: PascalCase with `I` prefix for interfaces (`IContract`)
- **Database managers**: PascalCase with `Manager` suffix (`ContractsManager`)

### File Organization

- Place components in the appropriate subdirectory under `components/`
- Co-locate related files (component + its CSS module + its types)
- Storage databases go in `storage/` following the existing Dexie pattern
- Types go in `types/`

### Styling

- Use Mantine's styling system (`styles` prop, `sx`, CSS modules)
- Support both dark and light modes — always test both:
  ```tsx
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  ```
- Use `theme.colors` for color references, not hardcoded values

### Do

- Use existing shared components (`ResultField`, `ToolItem`, `CustomCardWithHeaderAndFooter`)
- Handle loading and error states
- Show notifications for user actions (`@mantine/notifications`)
- Use `size="xs"` or `size="sm"` for form elements in the Handy Tools sidebar (space is limited)

### Don't

- Don't add new dependencies without discussing in the issue/PR first
- Don't modify the database schema without a migration plan
- Don't hardcode wallet addresses, RPC URLs, or network-specific values — use the app context/settings

## Commit Guidelines

Use clear, descriptive commit messages:

```
feat: add new handy tool for ENS resolution
fix: correct pagination in contracts table
docs: update contributing guidelines
refactor: extract common form logic into hook
style: fix dark mode colors in sidebar
```

### Prefixes

| Prefix | Use for |
|--------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `style` | Formatting, styling (no logic changes) |
| `refactor` | Code restructuring (no behavior changes) |
| `test` | Adding or updating tests |
| `chore` | Tooling, dependencies, config |

## Pull Request Process

1. **Fill out the PR template** — describe what you changed and why.

2. **Keep PRs focused** — one feature or fix per PR. Large PRs are harder to review.

3. **Ensure all checks pass**:
   - `yarn typecheck` — no TypeScript errors
   - `yarn lint` — no lint errors
   - `yarn build` — successful build

4. **Include screenshots** for any UI changes — show both dark and light mode.

5. **Link the related issue** if one exists (e.g., "Closes #42").

6. **Be responsive to feedback** — maintainers may request changes.

### PR Title Format

```
feat: short description of the change
fix: short description of the fix
```

## Reporting Bugs

When filing a bug report, include:

- **Summary**: One-line description of the issue
- **Steps to Reproduce**: Numbered list of steps to trigger the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, wallet extension, connected network
- **Screenshots/Logs**: Console errors, UI screenshots, system log output

## Requesting Features

When requesting a feature, include:

- **Problem**: What problem does this solve?
- **Proposed Solution**: How should it work?
- **Alternatives Considered**: Any other approaches you thought of
- **Additional Context**: Mockups, examples from other tools, etc.

## License

By contributing to Stark Deployer, you agree that your contributions will be subject to the project's [Business Source License 1.1 (BSL 1.1)](https://mariadb.com/bsl11/). See the [README](README.md#license) for full license details.

---

Thank you for helping make Stark Deployer better for the Starknet community!
