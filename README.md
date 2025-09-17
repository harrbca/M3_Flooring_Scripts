# M3 Flooring Scripts

A comprehensive collection of H5 JavaScript scripts designed specifically for the Infor M3 platform in the flooring industry. These scripts help automate common business processes, improve data accuracy, and enhance user productivity.

## Overview

This repository contains production-ready H5 scripts that extend Infor M3 functionality for flooring businesses. Each script is designed to integrate seamlessly with M3's H5 interface and follows best practices for maintainability and performance.

## Repository Structure

```
├── scripts/                    # Production H5 scripts organized by category
│   ├── inventory/             # Inventory management scripts
│   ├── purchasing/            # Purchasing and procurement scripts
│   ├── sales/                 # Sales order and customer scripts
│   ├── reporting/             # Reporting and analytics scripts
│   ├── utilities/             # Utility and helper scripts
│   └── customer-service/      # Customer service support scripts
├── examples/                  # Example scripts and usage demonstrations
├── templates/                 # Script templates for new development
├── docs/                      # Generated documentation (JSDoc)
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- Infor M3 system with H5 interface
- JavaScript knowledge
- Access to M3 development environment for testing

### Installation

1. Clone this repository to your development environment
2. Install dependencies (if using development tools):
   ```bash
   npm install
   ```
3. Review the scripts in your category of interest
4. Test scripts in your M3 development environment before production use

### Usage

Each script is self-contained and can be deployed to your M3 H5 environment. See individual script documentation for specific implementation instructions.

## Script Categories

### 🏭 Inventory Management
- Stock level monitoring and alerts
- Automated reorder point calculations
- Material movement tracking
- Cycle counting support

### 💰 Purchasing & Procurement
- Purchase order automation
- Vendor performance tracking
- Price comparison tools
- Approval workflow enhancements

### 📊 Sales & Customer Service
- Customer order processing
- Pricing calculations
- Delivery scheduling
- Customer communication tools

### 📈 Reporting & Analytics
- Custom report generation
- Data export utilities
- Performance dashboards
- KPI calculations

### 🔧 Utilities
- Data validation tools
- Backup and maintenance scripts
- Integration helpers
- System monitoring

## Development

### Code Standards

- All scripts use ES6+ JavaScript
- JSDoc documentation is required
- Follow the provided templates
- Include comprehensive error handling

### Testing

Test all scripts thoroughly in a development M3 environment before deploying to production. Each script should handle various error conditions and user permissions gracefully.

### Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to submit new scripts or improvements.

## Documentation

- Individual script documentation is available in JSDoc format
- Generate documentation: `npm run docs`
- Each script category has its own README with specific guidance

## Support

For questions about specific scripts or implementation guidance:

1. Check the script's JSDoc documentation
2. Review the examples folder
3. Consult the category-specific README files
4. Open an issue for community support

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Disclaimer

These scripts are provided as-is for educational and development purposes. Always test thoroughly in your development environment before deploying to production. The authors are not responsible for any issues that may arise from using these scripts in production environments.
