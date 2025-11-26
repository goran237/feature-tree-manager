import React from 'react'

function FeatureDetailsModal({ isOpen, feature, onClose, onEdit, onAddChild, onDelete, getWeightColor, calculateWeight }) {
  if (!isOpen || !feature) return null

  const handleBackdropClick = (e) => {
    if (e.target.id === 'detailsModal') {
      onClose()
    }
  }

  return (
    <div
      id="detailsModal"
      className={`modal ${isOpen ? 'active' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2>{feature.name}</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <h3>Description</h3>
            <p>{feature.description || <em>No description</em>}</p>
          </div>
          <div className="detail-section">
            <h3>Required</h3>
            <p>{feature.required ? 'Yes' : 'No'}</p>
          </div>
          <div className="detail-section">
            <h3>Metrics</h3>
            <div className="feature-pills modal-pills">
              <span className="pill pill-frequency">
                Frequency: {feature.frequency !== undefined ? feature.frequency : 0}
              </span>
              <span className="pill pill-damage">
                Damage: {feature.damage !== undefined ? feature.damage : 0}
              </span>
              <span 
                className="pill pill-weight"
                style={{
                  backgroundColor: getWeightColor ? getWeightColor(calculateWeight ? calculateWeight(feature) : 0) : 'rgba(75, 85, 99, 0.2)',
                  color: '#1f2937',
                  borderColor: getWeightColor ? getWeightColor(calculateWeight ? calculateWeight(feature) : 0) : 'rgba(75, 85, 99, 0.4)'
                }}
              >
                Weight: {calculateWeight ? calculateWeight(feature) : (Math.pow(2, feature.frequency !== undefined ? feature.frequency : 0) + Math.pow(2, feature.damage !== undefined ? feature.damage : 0))}
              </span>
            </div>
          </div>
          <div className="detail-section">
            <h3>Children</h3>
            <p>{feature.children ? feature.children.length : 0} sub-feature(s)</p>
          </div>
          <div className="detail-actions">
            <button className="btn btn-primary" onClick={() => {
              onClose()
              onEdit(null, feature.id)
            }}>
              Edit
            </button>
            <button className="btn btn-primary" onClick={() => {
              onClose()
              onAddChild(feature.id)
            }}>
              Add Child
            </button>
            <button className="btn btn-danger" onClick={() => {
              if (window.confirm('Are you sure you want to delete this feature and all its children?')) {
                onClose()
                onDelete(feature.id)
              }
            }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeatureDetailsModal

