# Contributing to M3 Flooring Scripts

Thank you for your interest in contributing to the M3 Flooring Scripts repository! This document provides guidelines for contributing new H5 scripts and improvements.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

## Script Development Guidelines

### Code Standards

- Follow the existing code style and structure
- Use JSDoc comments for all functions and classes
- Include error handling in all scripts
- Test your scripts in a development M3 environment before submitting

### Script Structure

All scripts should follow this basic structure:

```javascript
/**
 * @fileoverview Brief description of script purpose
 * @author Your Name
 * @version 1.0.0
 */

class YourScript extends H5ControllerBase {
  constructor(args) {
    super(args);
    // Initialize your script
  }

  execute() {
    // Main script logic
  }

  // Additional methods...
}
```

### File Organization

- Place scripts in appropriate category folders under `/scripts/`
- Add example usage to `/examples/` if applicable
- Update category README files when adding new scripts
- Use descriptive file names with kebab-case

### Documentation

- Include comprehensive JSDoc comments
- Provide usage examples
- Document all parameters and return values
- Update README files as needed

## Testing

- Test all scripts in a development M3 environment
- Verify scripts work with different user permissions
- Test error handling scenarios
- Document any M3 version dependencies

## Submitting Changes

1. Ensure your code follows the style guidelines
2. Add/update tests if applicable
3. Update documentation
4. Commit with descriptive messages
5. Push to your fork
6. Create a Pull Request

## Code Review Process

- All submissions require code review
- Scripts must be tested in M3 environment
- Documentation must be complete and accurate
- Code must follow established patterns

## Questions?

If you have questions about contributing, please open an issue or contact the maintainers.