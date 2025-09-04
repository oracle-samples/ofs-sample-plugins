# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.



## Project Overview

This is an Oracle Field Service (OFS/OFSC) plugin called "inventoryManager" - a sample plugin template for developing OFS customizations. The project follows the standard OFS plugin architecture with TypeScript, Webpack bundling, and a web-based interface.

## Common Development Commands

### Build and Development
- `npm test` - Run Jest tests
- `webpack --mode=development` - Build for development with source maps
- `webpack --mode=production` - Build for production with minification
- `npx webpack` - Default webpack build

### Project Structure
- `assets/js/` - TypeScript source code
  - `main.ts` - Entry point, initializes CustomPlugin
  - `custom.ts` - Main plugin class extending OFSPlugin
  - `utils/jsonview.ts` - JSON tree viewer utility
- `assets/css/` - SCSS stylesheets (referenced but not present in scan)
- `tests/` - Jest test files
- `dist/` - Webpack build output
- `index.html` - Plugin UI template with Bootstrap accordion layout

## Architecture

### Plugin System
The plugin extends the `@ofs-users/plugin` framework:
- `CustomPlugin` class extends `OFSPlugin` base class
- Implements `open(data: OFSOpenMessage)` method to handle plugin initialization
- Uses `JSONTree` utility to display incoming data in a collapsible tree format

### Build System
- **Webpack 5** with TypeScript loader and Terser optimization
- **Entry**: `assets/js/main.ts` → **Output**: `dist/main.js`
- **TypeScript**: ES2020 target, strict mode enabled
- **SCSS**: Processed via sass-loader, css-loader, style-loader chain
- **Buffer polyfill**: Required for browser compatibility

### Dependencies
- `@ofs-users/plugin` - Core OFS plugin framework
- `@ofs-users/proxy` - OFS proxy utilities
- Bootstrap 5.2.2 (CDN) for UI components

### Configuration Files
- Template files: `_TEMPLATE_credentials.json`, `_TEMPLATE_descriptor.json`
- Plugin properties configured in descriptor (activity/aid, securedParams)
- Test data available in `tests/test_data/test_data_001.json`

## Development Notes

### Plugin Registration
The plugin is registered globally as `window.ofs` on page load with identifier "inventoryManager".

### UI Components
The interface uses Bootstrap accordion layout with debug section showing input data via the JSONTree viewer.

### Testing
Basic Jest setup with minimal test coverage - primarily uses `ts-jest` for TypeScript support.