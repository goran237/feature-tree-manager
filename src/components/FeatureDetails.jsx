import React from 'react'

function FeatureDetails({ feature, onEdit, onAddChild, onDelete, getWeightColor, calculateWeight }) {
  if (!feature) {
    return (
      <div className="details-panel">
        <div className="panel-placeholder">
          <p>Select a feature to view or edit details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="details-panel">
      <div className="feature-details active">
        <div className="detail-section">
          <h3>Name</h3>
          <p>{feature.name}</p>
        </div>
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
          <div className="feature-pills">
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
          <button className="btn btn-primary" onClick={() => onEdit(null, feature.id)}>
            Edit
          </button>
          <button className="btn btn-primary" onClick={() => onAddChild(feature.id)}>
            Add Child
          </button>
          <button className="btn btn-danger" onClick={() => onDelete(feature.id)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeatureDetails

