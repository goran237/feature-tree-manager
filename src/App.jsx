import React, { useState, useEffect } from 'react'
import TreeNode, { getGlobalDragType, getGlobalDraggedFeatureId } from './components/TreeNode'
import FeatureModal from './components/FeatureModal'
import FeatureDetailsModal from './components/FeatureDetailsModal'
import db from './utils/database'
import { updateFeatureStatus, fetchAllStatuses } from './utils/api'

function App() {
  const [features, setFeatures] = useState([])
  const [selectedFeatureId, setSelectedFeatureId] = useState(null)
  const [detailsModalState, setDetailsModalState] = useState({
    isOpen: false,
    featureId: null
  })
  const [modalState, setModalState] = useState({
    isOpen: false,
    parentId: null,
    featureId: null
  })

  useEffect(() => {
    // Initialize database and load data
    db.init().then(() => {
      loadFromStorage()
    })
  }, [])

  const saveToStorage = (updatedFeatures) => {
    const featuresToSave = updatedFeatures || features
    db.save(featuresToSave)
  }

  const getTestData = () => {
    return [
      {
        id: 'test-1',
        name: 'User Authentication',
        description: 'Implement user login, registration, and session management',
        frequency: 8,
        damage: 7,
        required: true,
        parentId: null,
        children: [
          {
            id: 'test-1-1',
            name: 'Login Page',
            description: 'Create login form with email and password',
            frequency: 9,
            damage: 5,
            required: true,
            status: 'pass',
            parentId: 'test-1',
            children: [],
            expanded: true
          },
          {
            id: 'test-1-2',
            name: 'Registration Flow',
            description: 'User signup with email verification',
            frequency: 6,
            damage: 4,
            required: false,
            status: 'failed',
            parentId: 'test-1',
            children: [],
            expanded: true
          },
          {
            id: 'test-1-3',
            name: 'Password Reset',
            description: 'Forgot password functionality',
            frequency: 3,
            damage: 2,
            required: false,
            parentId: 'test-1',
            children: [],
            expanded: true
          }
        ],
        expanded: true
      },
      {
        id: 'test-2',
        name: 'Dashboard',
        description: 'Main user dashboard with analytics and widgets',
        frequency: 7,
        damage: 6,
        required: false,
        parentId: null,
        children: [
          {
            id: 'test-2-1',
            name: 'Analytics Widget',
            description: 'Display user activity metrics',
            frequency: 5,
            damage: 3,
            required: false,
            parentId: 'test-2',
            children: [],
            expanded: true
          },
          {
            id: 'test-2-2',
            name: 'Recent Activity Feed',
            description: 'Show recent user actions',
            frequency: 8,
            damage: 4,
            required: false,
            parentId: 'test-2',
            children: [],
            expanded: true
          }
        ],
        expanded: true
      },
      {
        id: 'test-3',
        name: 'Payment Integration',
        description: 'Stripe payment gateway integration',
        frequency: 9,
        damage: 10,
        required: true,
        parentId: null,
        children: [
          {
            id: 'test-3-1',
            name: 'Payment Form',
            description: 'Credit card input and validation',
            frequency: 7,
            damage: 8,
            required: true,
            parentId: 'test-3',
            children: [],
            expanded: true
          },
          {
            id: 'test-3-2',
            name: 'Subscription Management',
            description: 'Handle recurring payments',
            frequency: 4,
            damage: 6,
            required: false,
            parentId: 'test-3',
            children: [],
            expanded: true
          }
        ],
        expanded: true
      },
      {
        id: 'test-4',
        name: 'API Documentation',
        description: 'Comprehensive API documentation with examples',
        frequency: 2,
        damage: 1,
        required: false,
        parentId: null,
        children: [],
        expanded: true
      }
    ]
  }

  const loadFromStorage = async () => {
    const loaded = db.load()
    let featuresToSet = []
    
    if (loaded && loaded.length > 0) {
      featuresToSet = loaded
    } else {
      // If no data in storage, load test data
      featuresToSet = getTestData()
      db.save(featuresToSet)
    }

    // Fetch statuses from backend and merge them
    try {
      const statuses = await fetchAllStatuses()
      // Recursively merge statuses into features
      const mergeStatuses = (featureList) => {
        return featureList.map(feature => {
          const updatedFeature = {
            ...feature,
            status: statuses[feature.id] !== undefined ? statuses[feature.id] : feature.status
          }
          if (feature.children && feature.children.length > 0) {
            updatedFeature.children = mergeStatuses(feature.children)
          }
          return updatedFeature
        })
      }
      featuresToSet = mergeStatuses(featuresToSet)
      // Save merged data back to localStorage
      db.save(featuresToSet)
    } catch (error) {
      console.error('Failed to sync statuses from server:', error)
      // Continue with local data if server is unavailable
    }
    
    setFeatures(featuresToSet)
  }

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const findFeature = (id, featureList = features) => {
    for (const feature of featureList) {
      if (feature.id === id) {
        return feature
      }
      if (feature.children && feature.children.length > 0) {
        const found = findFeature(id, feature.children)
        if (found) return found
      }
    }
    return null
  }

  const updateFeatureInTree = (id, updates, featureList) => {
    return featureList.map(feature => {
      if (feature.id === id) {
        return { ...feature, ...updates }
      }
      if (feature.children && feature.children.length > 0) {
        return {
          ...feature,
          children: updateFeatureInTree(id, updates, feature.children)
        }
      }
      return feature
    })
  }

  const removeFeatureFromTree = (id, featureList) => {
    return featureList
      .filter(f => f.id !== id)
      .map(feature => {
        if (feature.children && feature.children.length > 0) {
          return {
            ...feature,
            children: removeFeatureFromTree(id, feature.children)
          }
        }
        return feature
      })
  }

  const addFeatureToTree = (newFeature, parentId, featureList) => {
    if (parentId) {
      return featureList.map(feature => {
        if (feature.id === parentId) {
          return {
            ...feature,
            children: [...(feature.children || []), newFeature]
          }
        }
        if (feature.children && feature.children.length > 0) {
          return {
            ...feature,
            children: addFeatureToTree(newFeature, parentId, feature.children)
          }
        }
        return feature
      })
    }
    return [...featureList, newFeature]
  }

  const handleAddFeature = (name, description, frequency, damage, required, parentId) => {
    const newFeature = {
      id: generateId(),
      name,
      description: description || '',
      frequency: frequency !== undefined ? frequency : 0,
      damage: damage !== undefined ? damage : 0,
      required: required || false,
      parentId,
      children: [],
      expanded: true
    }

    const updatedFeatures = addFeatureToTree(newFeature, parentId, features)
    setFeatures(updatedFeatures)
    saveToStorage(updatedFeatures)
  }

  const handleUpdateFeature = (id, updates) => {
    const updatedFeatures = updateFeatureInTree(id, updates, features)
    setFeatures(updatedFeatures)
    saveToStorage(updatedFeatures)
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      // Update locally first for immediate feedback
      const updatedFeatures = updateFeatureInTree(id, { status }, features)
      setFeatures(updatedFeatures)
      saveToStorage(updatedFeatures)

      // Send POST request to update status on server
      await updateFeatureStatus(id, status)
    } catch (error) {
      console.error('Failed to update status on server:', error)
      // Optionally revert the local change or show an error message
      // For now, we'll keep the local change even if the API call fails
    }
  }

  const handleDeleteFeature = (id) => {
    if (window.confirm('Are you sure you want to delete this feature and all its children?')) {
      const updatedFeatures = removeFeatureFromTree(id, features)
      setFeatures(updatedFeatures)
      saveToStorage(updatedFeatures)
      if (selectedFeatureId === id) {
        setSelectedFeatureId(null)
      }
    }
  }

  const handleToggleExpand = (id) => {
    const feature = findFeature(id)
    if (feature) {
      const updatedFeatures = updateFeatureInTree(id, {
        expanded: !feature.expanded
      }, features)
      setFeatures(updatedFeatures)
      saveToStorage(updatedFeatures)
    }
  }

  // Find the parent of a feature
  const findParent = (featureId, featureList = features, parent = null) => {
    for (const feature of featureList) {
      if (feature.id === featureId) {
        return parent
      }
      if (feature.children && feature.children.length > 0) {
        const found = findParent(featureId, feature.children, feature)
        if (found !== null) return found
      }
    }
    return null
  }

  // Get siblings of a feature (features with the same parent)
  const getSiblings = (featureId, featureList = features) => {
    const parent = findParent(featureId, featureList)
    if (parent === null) {
      // Root level features
      return featureList.filter(f => f.id !== featureId)
    }
    return (parent.children || []).filter(f => f.id !== featureId)
  }

  // Check if two features are siblings
  const areSiblings = (featureId1, featureId2, featureList = features) => {
    const parent1 = findParent(featureId1, featureList)
    const parent2 = findParent(featureId2, featureList)
    return parent1 === parent2 || (parent1 === null && parent2 === null)
  }

  // Swap two sibling features
  const swapSiblings = (featureId1, featureId2, featureList) => {
    const parent1 = findParent(featureId1, featureList)
    const parent2 = findParent(featureId2, featureList)
    
    // They should have the same parent
    if (parent1 !== parent2 && !(parent1 === null && parent2 === null)) {
      return featureList
    }

    const swapInList = (list) => {
      const index1 = list.findIndex(f => f.id === featureId1)
      const index2 = list.findIndex(f => f.id === featureId2)
      
      if (index1 !== -1 && index2 !== -1) {
        // Both found at this level - swap them
        const newList = [...list]
        ;[newList[index1], newList[index2]] = [newList[index2], newList[index1]]
        return newList
      }

      // Not both found at this level, recursively check children
      return list.map(feature => {
        if (feature.children && feature.children.length > 0) {
          return {
            ...feature,
            children: swapInList(feature.children)
          }
        }
        return feature
      })
    }

    return swapInList(featureList)
  }

  // Check if targetId is a descendant of sourceId (to prevent circular moves)
  const isDescendant = (sourceId, targetId, featureList = features) => {
    const source = findFeature(sourceId, featureList)
    if (!source) return false
    
    const checkChildren = (feature) => {
      if (feature.id === targetId) return true
      if (feature.children && feature.children.length > 0) {
        return feature.children.some(child => checkChildren(child))
      }
      return false
    }
    
    return checkChildren(source)
  }

  // Check if targetId is an ancestor of sourceId (to prevent moving child to grandparent, etc.)
  const isAncestor = (sourceId, targetId, featureList = features) => {
    const source = findFeature(sourceId, featureList)
    if (!source) return false
    
    let current = source
    while (current && current.parentId) {
      if (current.parentId === targetId) {
        return true
      }
      current = findFeature(current.parentId, featureList)
      if (!current) break
    }
    return false
  }

  const handleMoveFeature = (featureId, targetFeatureId, forceMakeChild = false, dragType = 'swap') => {
    // Prevent moving to itself
    if (featureId === targetFeatureId) {
      return false
    }

    // If drag type is swap, only allow swapping siblings
    if (dragType === 'swap') {
      const areSiblingsCheck = areSiblings(featureId, targetFeatureId)
      if (areSiblingsCheck) {
        const updatedFeatures = swapSiblings(featureId, targetFeatureId, features)
        setFeatures(updatedFeatures)
        saveToStorage(updatedFeatures)
        return true
      }
      return false
    }

    // If drag type is move, make it a child (or root if targetFeatureId is null)
    if (dragType === 'move') {
      // If targetFeatureId is null, move to root level
      if (targetFeatureId === null) {
        // Find the feature to move (with all its children preserved)
        const featureToMove = findFeature(featureId)
        if (!featureToMove) return false

        // Create a deep copy function to preserve the entire subtree
        const deepCopyFeature = (feature) => {
          return {
            ...feature,
            children: feature.children && feature.children.length > 0
              ? feature.children.map(child => deepCopyFeature(child))
              : []
          }
        }

        // Create a deep copy of the feature to move, preserving all children recursively
        const featureCopy = deepCopyFeature(featureToMove)

        // Remove from old location
        const withoutFeature = removeFeatureFromTree(featureId, features)
        
        // Update the feature's parentId to null (make it root)
        const updatedFeature = {
          ...featureCopy,
          parentId: null
        }

        // Add to root level
        const updatedFeatures = [...withoutFeature, updatedFeature]
        setFeatures(updatedFeatures)
        saveToStorage(updatedFeatures)
        return true
      }

      // Otherwise, move to a specific parent
      const newParentId = targetFeatureId

      // Prevent moving to its descendants (would create a cycle)
      if (isDescendant(featureId, newParentId)) {
        return false
      }

      // Find the feature to move (with all its children preserved)
      const featureToMove = findFeature(featureId)
      if (!featureToMove) return false

      // Create a deep copy function to preserve the entire subtree
      const deepCopyFeature = (feature) => {
        return {
          ...feature,
          children: feature.children && feature.children.length > 0
            ? feature.children.map(child => deepCopyFeature(child))
            : []
        }
      }

      // Create a deep copy of the feature to move, preserving all children recursively
      const featureCopy = deepCopyFeature(featureToMove)

      // Remove from old location FIRST (before adding to new location)
      const withoutFeature = removeFeatureFromTree(featureId, features)
      
      // Update the feature's parentId (children are preserved)
      const updatedFeature = {
        ...featureCopy,
        parentId: newParentId
      }

      // Ensure the new parent is expanded so the child is visible
      const ensureParentExpanded = (featureList) => {
        return featureList.map(f => {
          if (f.id === newParentId) {
            return { ...f, expanded: true, children: f.children || [] }
          }
          if (f.children && f.children.length > 0) {
            return { ...f, children: ensureParentExpanded(f.children) }
          }
          return f
        })
      }

      // Verify the new parent exists in the tree after removal
      const newParentExists = findFeature(newParentId, withoutFeature)
      if (!newParentExists) {
        return false
      }

      // Add to new location
      let updatedFeatures = addFeatureToTree(updatedFeature, newParentId, withoutFeature)
      
      // Verify the feature was added successfully
      const addedFeature = findFeature(featureId, updatedFeatures)
      if (!addedFeature) {
        return false
      }
      
      // Ensure parent is expanded
      updatedFeatures = ensureParentExpanded(updatedFeatures)
      setFeatures(updatedFeatures)
      saveToStorage(updatedFeatures)
      return true
    }

    return false
  }

  const openModal = (parentId = null, featureId = null) => {
    setModalState({
      isOpen: true,
      parentId,
      featureId
    })
  }

  const closeModal = () => {
    setModalState({
      isOpen: false,
      parentId: null,
      featureId: null
    })
  }

  const openDetailsModal = (featureId) => {
    setDetailsModalState({
      isOpen: true,
      featureId
    })
  }

  const closeDetailsModal = () => {
    setDetailsModalState({
      isOpen: false,
      featureId: null
    })
  }

  const selectedFeature = selectedFeatureId ? findFeature(selectedFeatureId) : null

  // Calculate weight for a feature
  const calculateWeight = (feature) => {
    const freq = feature.frequency !== undefined ? feature.frequency : 0
    const dmg = feature.damage !== undefined ? feature.damage : 0
    return Math.pow(2, freq) + Math.pow(2, dmg)
  }

  // Calculate total weight of all children
  const calculateChildrenWeight = (feature) => {
    if (!feature.children || feature.children.length === 0) {
      return 0
    }
    return feature.children.reduce((total, child) => {
      return total + calculateWeight(child) + calculateChildrenWeight(child)
    }, 0)
  }

  // Calculate weight contribution percentage
  // Shows what percentage this feature's weight represents of all its siblings' total weight
  // All siblings' percentages should add up to 100%
  const calculateWeightContribution = (feature, featureList = features) => {
    // Find the parent of this feature
    const parent = findParent(feature.id, featureList)
    
    // If no parent (root feature), return null (no contribution to show)
    if (parent === null) {
      return null
    }

    // Get all siblings (including this feature)
    const siblings = parent.children || []
    
    // Calculate total weight of all siblings
    const siblingsTotalWeight = siblings.reduce((total, sibling) => {
      return total + calculateWeight(sibling)
    }, 0)
    
    // Avoid division by zero
    if (siblingsTotalWeight === 0) {
      return 0
    }
    
    // Calculate this feature's weight
    const featureWeight = calculateWeight(feature)
    
    // Calculate percentage: (this feature's weight / total siblings weight) * 100
    const contribution = (featureWeight / siblingsTotalWeight) * 100
    
    return Math.round(contribution * 10) / 10 // Round to 1 decimal place
  }

  // Get all weights from features tree
  const getAllWeights = (featureList) => {
    const weights = []
    const traverse = (items) => {
      items.forEach(item => {
        weights.push(calculateWeight(item))
        if (item.children && item.children.length > 0) {
          traverse(item.children)
        }
      })
    }
    traverse(featureList)
    return weights
  }

  // Calculate min and max weights
  const allWeights = features.length > 0 ? getAllWeights(features) : [0]
  const minWeight = Math.min(...allWeights)
  const maxWeight = Math.max(...allWeights)

  // Interpolate color from light blue to papaya yellow
  const getWeightColor = (weight) => {
    if (maxWeight === minWeight) return 'rgb(147, 197, 253)' // light blue
    
    const ratio = (weight - minWeight) / (maxWeight - minWeight)
    
    // Light blue: rgb(147, 197, 253) or #93c5fd
    // Papaya yellow: rgb(251, 191, 36) or #fbbf24
    const r = Math.round(147 + (251 - 147) * ratio)
    const g = Math.round(197 + (191 - 197) * ratio)
    const b = Math.round(253 + (36 - 253) * ratio)
    
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div className="container">
      <header>
        <h1>Feature Tree Manager</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Add Root Feature
        </button>
      </header>

      <div className="main-content">
        <div 
          className="tree-container"
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Only allow drop if using move handle
            // We need to check the drag type from the event or use a workaround
            // Since we can't access the global variable here, check effectAllowed
            const effectAllowed = e.dataTransfer.effectAllowed
            if (effectAllowed === 'copy' || e.dataTransfer.types.includes('drag-type')) {
              e.dataTransfer.dropEffect = 'copy'
              e.currentTarget.classList.add('drag-over-container')
            } else {
              e.dataTransfer.dropEffect = 'none'
              e.currentTarget.classList.remove('drag-over-container')
            }
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('drag-over-container')
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.classList.remove('drag-over-container')
            
            const draggedFeatureId = getGlobalDraggedFeatureId() || e.dataTransfer.getData('text/plain')
            const dragType = getGlobalDragType() || 'swap'
            
            // Only allow moving to root if using move handle
            if (draggedFeatureId && handleMoveFeature && dragType === 'move') {
              handleMoveFeature(draggedFeatureId, null, true, 'move')
            }
          }}
        >
          {features.length === 0 ? (
            <div className="empty-state">
              <h3>No features yet</h3>
              <p>Click "Add Root Feature" to get started</p>
            </div>
          ) : (
            <div className="tree-view">
              {features.map(feature => (
                <TreeNode
                  key={feature.id}
                  feature={feature}
                  level={0}
                  selectedId={selectedFeatureId}
                  onSelect={setSelectedFeatureId}
                  onAddChild={openModal}
                  onEdit={openModal}
                  onDelete={handleDeleteFeature}
                  onToggleExpand={handleToggleExpand}
                  onUpdate={handleUpdateFeature}
                  onUpdateStatus={handleUpdateStatus}
                  getWeightColor={getWeightColor}
                  calculateWeight={calculateWeight}
                  calculateWeightContribution={calculateWeightContribution}
                  onShowDetails={openDetailsModal}
                  onMoveFeature={handleMoveFeature}
                  areSiblings={areSiblings}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <FeatureModal
        isOpen={modalState.isOpen}
        parentId={modalState.parentId}
        featureId={modalState.featureId}
        feature={modalState.featureId ? findFeature(modalState.featureId) : null}
        onClose={closeModal}
        onSave={modalState.featureId ? handleUpdateFeature : handleAddFeature}
      />

      <FeatureDetailsModal
        isOpen={detailsModalState.isOpen}
        feature={detailsModalState.featureId ? findFeature(detailsModalState.featureId) : null}
        onClose={closeDetailsModal}
        onEdit={openModal}
        onAddChild={openModal}
        onDelete={handleDeleteFeature}
        getWeightColor={getWeightColor}
        calculateWeight={calculateWeight}
      />
    </div>
  )
}

export default App

