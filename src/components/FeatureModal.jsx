import React, { useState, useEffect } from 'react'

function FeatureModal({ isOpen, parentId, featureId, feature, onClose, onSave }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState(0)
  const [damage, setDamage] = useState(0)
  const [required, setRequired] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (feature) {
        setName(feature.name)
        setDescription(feature.description || '')
        setFrequency(feature.frequency !== undefined ? feature.frequency : 0)
        setDamage(feature.damage !== undefined ? feature.damage : 0)
        setRequired(feature.required || false)
      } else {
        setName('')
        setDescription('')
        setFrequency(0)
        setDamage(0)
        setRequired(false)
      }
    }
  }, [isOpen, feature])

  const handleFrequencyChange = (e) => {
    const value = parseInt(e.target.value) || 0
    const clampedValue = Math.max(0, Math.min(10, value))
    setFrequency(clampedValue)
  }

  const handleDamageChange = (e) => {
    const value = parseInt(e.target.value) || 0
    const clampedValue = Math.max(0, Math.min(10, value))
    setDamage(clampedValue)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      alert('Please enter a feature name')
      return
    }

    if (featureId) {
      onSave(featureId, { name: trimmedName, description: description.trim(), frequency, damage, required })
    } else {
      onSave(trimmedName, description.trim(), frequency, damage, required, parentId)
    }
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target.id === 'modal') {
      onClose()
    }
  }

  if (!isOpen) return null

  const title = featureId ? 'Edit Feature' : (parentId ? 'Add Child Feature' : 'Add Root Feature')

  return (
    <div
      id="modal"
      className={`modal ${isOpen ? 'active' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <form id="featureForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="featureName">Feature Name:</label>
              <input
                type="text"
                id="featureName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="featureDescription">Description:</label>
              <textarea
                id="featureDescription"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="featureFrequency">Frequency (0-10):</label>
              <input
                type="number"
                id="featureFrequency"
                min="0"
                max="10"
                value={frequency}
                onChange={handleFrequencyChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="featureDamage">Damage (0-10):</label>
              <input
                type="number"
                id="featureDamage"
                min="0"
                max="10"
                value={damage}
                onChange={handleDamageChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="featureRequired"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
                <span>Required</span>
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FeatureModal

