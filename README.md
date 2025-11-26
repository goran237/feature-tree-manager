# Feature Tree Manager

A modern React web application for managing features in a hierarchical tree structure with full CRUD operations.

## Features

- **Tree View**: Visual representation of features in a hierarchical structure
- **CRUD Operations**: Create, Read, Update, and Delete features
- **Nested Features**: Support for parent-child relationships
- **Status Tracking**: Track feature status (Planned, In Progress, Completed, On Hold)
- **Persistent Storage**: Data is saved to browser's localStorage
- **Modern UI**: Beautiful red-themed design with smooth animations
- **React Components**: Built with React 18 and modern hooks

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Usage

1. Click "Add Root Feature" to create your first feature
2. Click on any feature to view details
3. Use the action buttons to add children, edit, or delete features

## Usage

### Creating Features
- Click "Add Root Feature" to create a top-level feature
- Click the "+" button on any feature to add a child feature
- Fill in the form with feature name, description, and status

### Viewing Features
- Click on any feature in the tree to view its details in the right panel
- Expand/collapse parent features by clicking the arrow icon

### Editing Features
- Click on a feature to select it
- Click "Edit" in the details panel, or click the edit icon (✎) on the feature
- Modify the details and save

### Deleting Features
- Click "Delete" in the details panel, or click the delete icon (×) on the feature
- Note: Deleting a feature will also delete all its children

## Technologies

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **CSS3**: Modern styling with gradients, backdrop-filter, and animations
- **LocalStorage**: Browser-based data persistence

## Project Structure

```
requirements/
├── src/
│   ├── components/
│   │   ├── TreeNode.jsx       # Recursive tree node component
│   │   ├── FeatureModal.jsx   # Add/Edit modal component
│   │   └── FeatureDetails.jsx # Feature details panel
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # React entry point
│   └── styles.css             # Global styles
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
└── vite.config.js            # Vite configuration
```

## Browser Support

Works best in modern browsers that support:
- ES6+ JavaScript
- React 18
- CSS Grid
- CSS Custom Properties
- LocalStorage API

