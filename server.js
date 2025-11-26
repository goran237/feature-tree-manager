import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Initialize SQLite database
const db = new Database(join(__dirname, 'features.db'))

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS feature_statuses (
    feature_id TEXT PRIMARY KEY,
    status TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Prepare statements for better performance
const insertOrUpdateStatus = db.prepare(`
  INSERT INTO feature_statuses (feature_id, status, updated_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(feature_id) DO UPDATE SET
    status = excluded.status,
    updated_at = CURRENT_TIMESTAMP
`)

const getStatus = db.prepare('SELECT status FROM feature_statuses WHERE feature_id = ?')
const getAllStatuses = db.prepare('SELECT feature_id, status FROM feature_statuses')

// POST endpoint to update feature status
app.post('/api/features/status', (req, res) => {
  const { featureId, status } = req.body

  if (!featureId) {
    return res.status(400).json({ error: 'featureId is required' })
  }

  if (status !== 'pass' && status !== 'failed' && status !== null) {
    return res.status(400).json({ error: 'status must be "pass", "failed", or null' })
  }

  try {
    // Store the status in database
    insertOrUpdateStatus.run(featureId, status)

    console.log(`Updated feature ${featureId} status to: ${status}`)

    // Return success response
    res.json({
      success: true,
      featureId,
      status,
      message: `Feature ${featureId} status updated to ${status || 'none'}`
    })
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// GET endpoint to retrieve feature status
app.get('/api/features/status/:featureId', (req, res) => {
  const { featureId } = req.params
  
  try {
    const row = getStatus.get(featureId)
    const status = row ? row.status : null

    res.json({
      featureId,
      status
    })
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: 'Failed to retrieve status' })
  }
})

// GET endpoint to retrieve all feature statuses
app.get('/api/features/status', (req, res) => {
  try {
    const rows = getAllStatuses.all()
    const allStatuses = {}
    rows.forEach(row => {
      allStatuses[row.feature_id] = row.status
    })
    res.json(allStatuses)
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: 'Failed to retrieve statuses' })
  }
})

// Serve static files from the React app build directory (after API routes)
app.use(express.static(join(__dirname, 'dist')))

// Serve React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API endpoint: http://localhost:${PORT}/api/features/status`)
})

