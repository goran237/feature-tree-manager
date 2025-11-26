/**
 * API utility for updating feature status
 * @param {string} featureId - The ID of the feature to update
 * @param {string} status - The new status ('pass' or 'failed')
 * @returns {Promise<Object>} - The response from the server
 */
export async function updateFeatureStatus(featureId, status) {
  try {
    const response = await fetch('/api/features/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        featureId,
        status
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating feature status:', error)
    // For development, we'll still update locally even if the API call fails
    // In production, you might want to handle this differently
    throw error
  }
}

/**
 * Fetch all feature statuses from the server
 * @returns {Promise<Object>} - Object mapping featureId to status
 */
export async function fetchAllStatuses() {
  try {
    const response = await fetch('/api/features/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    // Check if response is actually JSON (not HTML redirect page)
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Server returned non-JSON response. Service might be starting up.')
      return {}
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Fetched statuses from server:', data)
    return data
  } catch (error) {
    console.error('Error fetching statuses from server:', error)
    // Return empty object if fetch fails (server might not be running)
    return {}
  }
}

