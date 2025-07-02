# Contributing to FindConstructionStaffing

Thank you for your interest in contributing to FindConstructionStaffing! This guide will help you get started.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up your development environment (see README.md)
4. Create a feature branch from `main`
5. Make your changes
6. Submit a pull request

## 🔄 Development Workflow

### Branch Naming

- Feature branches: `feat/description`
- Bug fixes: `fix/description`
- Infrastructure: `infra/description`
- Documentation: `docs/description`

### Commit Messages

Follow conventional commits format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Maintenance tasks

Example: `feat: add agency search filtering by trade`

## ✅ Pull Request Process

### Before Submitting

1. **Run all checks locally:**

   ```bash
   npm run type-check  # TypeScript compilation
   npm run lint        # ESLint checks
   npm run format      # Prettier formatting
   npm run test        # Jest tests
   ```

2. **Fix any issues:**
   - TypeScript errors must be resolved
   - ESLint errors must be fixed
   - Code must be formatted with Prettier
   - All tests must pass

### PR Requirements

All pull requests must:

- ✅ Pass all CI/CD checks
- ✅ Have at least 1 approval
- ✅ Be up-to-date with main branch
- ✅ Include tests for new features
- ✅ Update documentation as needed

### CI/CD Checks

Our automated pipeline runs:

1. **Code Quality Checks** - TypeScript, ESLint, Prettier
2. **Run Tests** - Jest unit tests with coverage
3. **Security Scanning** - npm audit
4. **Build Application** - Next.js production build
5. **Preview Deployment** - Automatic Vercel preview for PRs

### Preview Deployments

Every pull request automatically gets a preview deployment:

- **URL Format**: `https://findconstructionstaffing-pr-{PR_NUMBER}.vercel.app`
- **Updates**: New commits trigger new deployments
- **Cleanup**: Preview removed when PR is closed

#### Preview Deployment Gates

Large PRs or PRs from forks may require the `deploy-preview` label:

- PRs from forks need explicit approval via label
- PRs with >1000 changes need review before deployment
- Add `deploy-preview` label to enable deployment

## 🛡️ Branch Protection

The `main` branch is protected with the following rules:

- Cannot push directly (must use PR)
- All CI checks must pass
- Requires 1 code review approval
- Stale reviews are dismissed on new commits
- Branches must be up-to-date before merging

## 📝 Code Standards

### TypeScript

- Strict mode is enabled
- Define types for all parameters and return values
- Avoid `any` type unless absolutely necessary

### React/Next.js

- Use functional components with hooks
- Follow Next.js App Router patterns
- Use server components where appropriate

### Testing

- Write tests for new features
- Maintain 80%+ code coverage
- Use meaningful test descriptions

### Styling

- Use Tailwind CSS utility classes
- Follow existing component patterns
- Use Shadcn/ui components when available

## 🐛 Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/environment details

## 💡 Suggesting Features

Feature suggestions should include:

- Problem statement
- Proposed solution
- Alternative solutions considered
- Mockups/examples if applicable

## 📚 Resources

- [Project Documentation](README.md)
- [API Documentation](docs/api/README.md)
- [Component Library](https://ui.shadcn.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## ❓ Questions?

If you have questions about contributing:

1. Check existing issues and PRs
2. Review project documentation
3. Ask in issue comments or discussions

Thank you for contributing to FindConstructionStaffing!
