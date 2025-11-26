import React, { useState } from 'react'

// Global variables to track the currently dragged feature ID and drag type
let globalDraggedFeatureId = null
let globalDragType = null

// Export for use in App.jsx
export function getGlobalDragType() {
  return globalDragType
}

export function getGlobalDraggedFeatureId() {
  return globalDraggedFeatureId
}

function TreeNode({ 
  feature, 
  level, 
  selectedId, 
  onSelect, 
  onAddChild, 
  onEdit, 
  onDelete, 
  onToggleExpand,
  onUpdate,
  onUpdateStatus,
  getWeightColor,
  calculateWeight,
  calculateWeightContribution,
  onShowDetails,
  onMoveFeature,
  areSiblings
}) {
  const hasChildren = feature.children && feature.children.length > 0
  const isExpanded = feature.expanded !== false
  const isSelected = selectedId === feature.id
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggedFeatureId, setDraggedFeatureId] = useState(null)

  const handleInfoClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (onShowDetails) {
      onShowDetails(feature.id)
    }
  }

  const handleDragStart = (e) => {
    // Check which handle is being dragged
    const isSwapHandle = e.target.closest('.drag-handle-swap')
    const isMoveHandle = e.target.closest('.drag-handle-move')
    
    if (!isSwapHandle && !isMoveHandle) {
      e.preventDefault()
      return false
    }
    
    e.stopPropagation()
    setIsDragging(true)
    setDraggedFeatureId(feature.id)
    globalDraggedFeatureId = feature.id
    
    // Store the drag type in dataTransfer and global variable
    if (isSwapHandle) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('drag-type', 'swap')
      globalDragType = 'swap'
    } else {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('drag-type', 'move')
      globalDragType = 'move'
    }
    
    e.dataTransfer.setData('text/plain', feature.id)
    e.dataTransfer.setData('application/json', JSON.stringify({ id: feature.id, name: feature.name }))
    // Add visual feedback
    e.currentTarget.closest('.tree-node-content').style.opacity = '0.5'
    return true
  }

  const handleDragEnd = (e) => {
    e.stopPropagation()
    setIsDragging(false)
    setDraggedFeatureId(null)
    globalDraggedFeatureId = null
    globalDragType = null
    setIsDragOver(false)
    // Restore opacity
    const nodeContent = e.currentTarget.closest('.tree-node-content')
    if (nodeContent) {
      nodeContent.style.opacity = '1'
    }
    // Clean up drag-over styles from all nodes
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over', 'drag-over-swap', 'drag-over-child'))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Get dragged ID from global variable (set during dragStart)
    const draggedId = globalDraggedFeatureId
    if (!draggedId || draggedId === feature.id) {
      setIsDragOver(false)
      return
    }

    // Get drag type from global variable (more reliable than dataTransfer)
    const dragType = globalDragType || e.dataTransfer.getData('drag-type') || 'swap'
    
    if (dragType === 'swap') {
      // Only allow swap if they're siblings
      const isSibling = areSiblings && areSiblings(draggedId, feature.id)
      if (isSibling) {
        e.dataTransfer.dropEffect = 'move'
        setIsDragOver(true)
      } else {
        e.dataTransfer.dropEffect = 'none'
        setIsDragOver(false)
      }
    } else if (dragType === 'move') {
      // Allow move to any feature (except itself and descendants)
      e.dataTransfer.dropEffect = 'copy'
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e) => {
    e.stopPropagation()
    // Don't clear if moving to a drop zone
    if (e.relatedTarget && e.relatedTarget.closest('.drop-zone')) {
      return
    }
    // Only set drag over to false if we're leaving the node content area
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
      setDragOverMode(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Use global variable as primary source, fallback to dataTransfer
    const draggedId = globalDraggedFeatureId || e.dataTransfer.getData('text/plain')
    
    // Get drag type from global variable (more reliable than dataTransfer in drop event)
    const dragType = globalDragType || 'swap'
    
    if (!draggedId || draggedId === feature.id || !onMoveFeature) {
      setIsDragOver(false)
      return
    }
    
    if (dragType === 'swap') {
      // Only allow swap if they're siblings
      const isSibling = areSiblings ? areSiblings(draggedId, feature.id) : false
      if (isSibling) {
        onMoveFeature(draggedId, feature.id, false, 'swap')
      }
    } else if (dragType === 'move') {
      // Move to make it a child
      onMoveFeature(draggedId, feature.id, true, 'move')
    }
    
    // Clean up after processing
    setIsDragOver(false)
  }
  

  const handleClick = (e) => {
    // Don't select if clicking on interactive elements or if we just finished dragging
    if (e.target.closest('.toggle-icon') || 
        e.target.closest('.node-actions') || 
        e.target.closest('.pill-editable') ||
        e.target.closest('.info-icon-container') ||
        e.target.closest('.drop-zone')) {
      return
    }
    // Only select if not dragging
    if (!isDragging) {
      onSelect(feature.id)
    }
  }

  const handlePillClick = (e, field) => {
    e.stopPropagation()
    setEditingField(field)
    setEditValue(feature[field] !== undefined ? feature[field].toString() : '0')
  }

  const handlePillChange = (e) => {
    const value = e.target.value
    setEditValue(value)
  }

  const handlePillBlur = () => {
    savePillValue()
  }

  const handlePillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      savePillValue()
    } else if (e.key === 'Escape') {
      setEditingField(null)
      setEditValue('')
    }
  }

  const savePillValue = () => {
    if (editingField && onUpdate) {
      const numValue = parseInt(editValue) || 0
      const clampedValue = Math.max(0, Math.min(10, numValue))
      onUpdate(feature.id, { [editingField]: clampedValue })
    }
    setEditingField(null)
    setEditValue('')
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    onToggleExpand(feature.id)
  }

  const handleAddChild = (e) => {
    e.stopPropagation()
    onAddChild(feature.id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    onEdit(null, feature.id)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(feature.id)
  }

  const handleStatusClick = (e) => {
    e.stopPropagation()
    if (onUpdateStatus) {
      // Toggle between pass, failed, and null (no status)
      const currentStatus = feature.status
      let newStatus
      if (currentStatus === 'pass') {
        newStatus = 'failed'
      } else if (currentStatus === 'failed') {
        newStatus = null
      } else {
        newStatus = 'pass'
      }
      onUpdateStatus(feature.id, newStatus)
    }
  }

  return (
    <div className="tree-node" data-level={level}>
      <div
        className={`tree-node-content ${hasChildren ? 'has-children' : ''} ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
        data-id={feature.id}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Handles */}
        <div className="drag-handles-container">
          {/* Swap Handle - Six Dots */}
          <div 
            className="drag-handle drag-handle-swap"
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            title="Drag to swap with sibling"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="4" cy="4" r="1.25" fill="currentColor" opacity="0.4"/>
              <circle cx="12" cy="4" r="1.25" fill="currentColor" opacity="0.4"/>
              <circle cx="4" cy="8" r="1.25" fill="currentColor" opacity="0.4"/>
              <circle cx="12" cy="8" r="1.25" fill="currentColor" opacity="0.4"/>
              <circle cx="4" cy="12" r="1.25" fill="currentColor" opacity="0.4"/>
              <circle cx="12" cy="12" r="1.25" fill="currentColor" opacity="0.4"/>
            </svg>
          </div>
          {/* Move Handle - Cross Arrow Icon */}
          <div 
            className="drag-handle drag-handle-move"
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            title="Drag to move to another node"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Horizontal line with arrowheads */}
              <line x1="2.5" y1="8" x2="5.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
              <line x1="10.5" y1="8" x2="13.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
              <path d="M13.5 8L10.8 5.8M13.5 8L10.8 10.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
              <path d="M2.5 8L5.2 5.8M2.5 8L5.2 10.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
              {/* Vertical line with arrowheads */}
              <line x1="8" y1="2.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
              <line x1="8" y1="10.5" x2="8" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
              <path d="M8 13.5L5.8 10.8M8 13.5L10.2 10.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
              <path d="M8 2.5L5.8 5.2M8 2.5L10.2 5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
            </svg>
          </div>
        </div>
        {hasChildren ? (
          <span
            className={`toggle-icon ${isExpanded ? 'expanded' : 'collapsed'}`}
            onClick={handleToggle}
          />
        ) : (
          <span style={{ width: '20px', display: 'inline-block' }}></span>
        )}
        <div className="tree-node-label">
          <span className="tree-node-name">{feature.name}</span>
          <span className="tree-node-id" title="Feature ID">{feature.id}</span>
          <div className="info-icon-container">
            <svg 
              className="info-icon" 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              onClick={handleInfoClick}
            >
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 6V8M8 10H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <label className="required-toggle" onClick={(e) => e.stopPropagation()} title="Toggle Required">
            <input
              type="checkbox"
              checked={feature.required || false}
              onChange={(e) => {
                e.stopPropagation()
                if (onUpdate) {
                  onUpdate(feature.id, { required: e.target.checked })
                }
              }}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Required</span>
          </label>
          <span
            className={`pill pill-status ${feature.status === 'pass' ? 'status-pass' : feature.status === 'failed' ? 'status-failed' : 'status-none'}`}
            onClick={handleStatusClick}
            title={`Click to toggle status: ${feature.status === 'pass' ? 'Pass → Failed' : feature.status === 'failed' ? 'Failed → None' : 'None → Pass'}`}
          >
            {feature.status === 'pass' ? '✓ Pass' : feature.status === 'failed' ? '✗ Failed' : '○ None'}
          </span>
          <div className="feature-pills">
            {editingField === 'frequency' ? (
              <input
                type="number"
                min="0"
                max="10"
                className="pill pill-frequency pill-editable pill-input"
                value={editValue}
                onChange={handlePillChange}
                onBlur={handlePillBlur}
                onKeyDown={handlePillKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span 
                className="pill pill-frequency pill-editable" 
                onClick={(e) => handlePillClick(e, 'frequency')}
                title="Click to edit frequency"
              >
                F: {feature.frequency !== undefined ? feature.frequency : 0}
              </span>
            )}
            {editingField === 'damage' ? (
              <input
                type="number"
                min="0"
                max="10"
                className="pill pill-damage pill-editable pill-input"
                value={editValue}
                onChange={handlePillChange}
                onBlur={handlePillBlur}
                onKeyDown={handlePillKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span 
                className="pill pill-damage pill-editable" 
                onClick={(e) => handlePillClick(e, 'damage')}
                title="Click to edit damage"
              >
                D: {feature.damage !== undefined ? feature.damage : 0}
              </span>
            )}
            <span 
              className="pill pill-weight"
              style={{
                backgroundColor: getWeightColor ? getWeightColor(calculateWeight ? calculateWeight(feature) : 0) : 'rgba(75, 85, 99, 0.2)',
                color: '#1f2937',
                borderColor: getWeightColor ? getWeightColor(calculateWeight ? calculateWeight(feature) : 0) : 'rgba(75, 85, 99, 0.4)'
              }}
            >
              W: {calculateWeight ? calculateWeight(feature) : (Math.pow(2, feature.frequency !== undefined ? feature.frequency : 0) + Math.pow(2, feature.damage !== undefined ? feature.damage : 0))}
            </span>
            {calculateWeightContribution && calculateWeightContribution(feature) !== null && (
              <span 
                className="pill pill-contribution"
                title="Weight contribution percentage to parent (sum of all siblings = 100%)"
              >
                C: {calculateWeightContribution(feature)}%
              </span>
            )}
          </div>
        </div>
        <div className="node-actions">
          <button
            className="btn btn-icon btn-primary"
            onClick={handleAddChild}
            title="Add Child"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="btn btn-icon btn-secondary"
            onClick={handleEdit}
            title="Edit"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5 1.5L12.5 3.5M9.5 2.5L2.5 9.5V11.5H4.5L11.5 4.5L9.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="btn btn-icon btn-danger"
            onClick={handleDelete}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="tree-children" data-parent={feature.id}>
          {feature.children.map(child => (
            <TreeNode
              key={child.id}
              feature={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              onUpdate={onUpdate}
              onUpdateStatus={onUpdateStatus}
              getWeightColor={getWeightColor}
              calculateWeight={calculateWeight}
              calculateWeightContribution={calculateWeightContribution}
              onShowDetails={onShowDetails}
              onMoveFeature={onMoveFeature}
              areSiblings={areSiblings}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TreeNode

