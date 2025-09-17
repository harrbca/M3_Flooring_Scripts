# M3 H5 Script Examples

This folder contains example implementations of H5 scripts for the Infor M3 platform in the flooring industry.

## Available Examples

### Core Examples

- **[inventory-check.js](./inventory-check.js)** - Demonstrates inventory level monitoring with alerts
- **[data-validator.js](./data-validator.js)** - Shows how to implement data validation across M3 modules

### Example Features Demonstrated

1. **M3 API Integration** - How to call M3 APIs from H5 scripts
2. **Error Handling** - Proper error handling and user notifications
3. **Data Processing** - Processing and validating M3 data
4. **User Interface** - Interacting with H5 user interface elements
5. **Logging** - Implementing comprehensive logging for debugging

## Using These Examples

1. **Study the Code** - Review the examples to understand the patterns and structure
2. **Adapt for Your Needs** - Modify the examples for your specific requirements
3. **Test Thoroughly** - Always test in a development environment first
4. **Follow Best Practices** - Use the examples as a guide for writing your own scripts

## Common Patterns

### Script Structure
All examples follow a consistent structure:
- Class-based organization extending H5ControllerBase
- Constructor for initialization
- Main execute() method
- Private helper methods
- Comprehensive error handling

### M3 API Calls
Examples show how to:
- Structure API calls to M3 programs
- Handle asynchronous responses
- Process API results
- Handle API errors

### User Interaction
Examples demonstrate:
- Displaying messages to users
- Collecting user input
- Showing progress indicators
- Handling user notifications

## Getting Started

1. Review the script template in `/templates/script-template.js`
2. Study the examples that match your use case
3. Copy and modify for your specific needs
4. Test in your M3 development environment

## Need Help?

- Check the main README for overall guidance
- Review category-specific README files in `/scripts/`
- Consult the CONTRIBUTING.md for development guidelines