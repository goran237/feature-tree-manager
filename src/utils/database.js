// Simple Local Database Utility
const DB_NAME = 'featureTreeDB'
const DB_VERSION = 1
const STORE_NAME = 'features'

class LocalDatabase {
  constructor() {
    this.dbName = DB_NAME
    this.version = DB_VERSION
    this.storeName = STORE_NAME
  }

  // Initialize database
  async init() {
    try {
      // Check if database exists
      const dbData = this.getDatabaseMetadata()
      if (!dbData) {
        this.createDatabase()
      }
      return true
    } catch (error) {
      console.error('Database initialization error:', error)
      return false
    }
  }

  // Get database metadata
  getDatabaseMetadata() {
    try {
      const meta = localStorage.getItem(`${this.dbName}_meta`)
      return meta ? JSON.parse(meta) : null
    } catch (error) {
      console.error('Error getting database metadata:', error)
      return null
    }
  }

  // Create database with metadata
  createDatabase() {
    const metadata = {
      name: this.dbName,
      version: this.version,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
    localStorage.setItem(`${this.dbName}_meta`, JSON.stringify(metadata))
  }

  // Update last modified timestamp
  updateMetadata() {
    const meta = this.getDatabaseMetadata()
    if (meta) {
      meta.lastModified = new Date().toISOString()
      localStorage.setItem(`${this.dbName}_meta`, JSON.stringify(meta))
    }
  }

  // Save features to database
  save(features) {
    try {
      const data = {
        version: this.version,
        timestamp: new Date().toISOString(),
        features: features || []
      }
      localStorage.setItem(this.storeName, JSON.stringify(data))
      this.updateMetadata()
      return true
    } catch (error) {
      console.error('Error saving to database:', error)
      // Fallback to simple storage if quota exceeded
      try {
        localStorage.setItem('featureTree', JSON.stringify(features || []))
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError)
        return false
      }
      return false
    }
  }

  // Load features from database
  load() {
    try {
      // Try new database format first
      const stored = localStorage.getItem(this.storeName)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.features && Array.isArray(data.features)) {
          return data.features
        }
      }

      // Fallback to old format for migration
      const oldStored = localStorage.getItem('featureTree')
      if (oldStored) {
        const oldData = JSON.parse(oldStored)
        if (Array.isArray(oldData)) {
          // Migrate old data to new format
          this.save(oldData)
          return oldData
        }
      }

      return null
    } catch (error) {
      console.error('Error loading from database:', error)
      // Try fallback
      try {
        const fallback = localStorage.getItem('featureTree')
        return fallback ? JSON.parse(fallback) : null
      } catch (fallbackError) {
        console.error('Fallback load also failed:', fallbackError)
        return null
      }
    }
  }

  // Export database to JSON
  export() {
    try {
      const data = this.load()
      const metadata = this.getDatabaseMetadata()
      return {
        metadata,
        data: {
          version: this.version,
          timestamp: new Date().toISOString(),
          features: data || []
        }
      }
    } catch (error) {
      console.error('Error exporting database:', error)
      return null
    }
  }

  // Import database from JSON
  import(importData) {
    try {
      if (!importData || !importData.data || !Array.isArray(importData.data.features)) {
        throw new Error('Invalid import data format')
      }

      // Create backup before import
      const backup = this.export()
      if (backup) {
        localStorage.setItem(`${this.dbName}_backup_${Date.now()}`, JSON.stringify(backup))
      }

      // Import new data
      this.save(importData.data.features)
      return true
    } catch (error) {
      console.error('Error importing database:', error)
      return false
    }
  }

  // Clear all database data
  clear() {
    try {
      localStorage.removeItem(this.storeName)
      localStorage.removeItem(`${this.dbName}_meta`)
      // Also clear old format
      localStorage.removeItem('featureTree')
      return true
    } catch (error) {
      console.error('Error clearing database:', error)
      return false
    }
  }

  // Get database statistics
  getStats() {
    try {
      const data = this.load()
      const metadata = this.getDatabaseMetadata()
      
      const countFeatures = (features) => {
        let count = 0
        features.forEach(feature => {
          count++
          if (feature.children && feature.children.length > 0) {
            count += countFeatures(feature.children)
          }
        })
        return count
      }

      return {
        totalFeatures: data ? countFeatures(data) : 0,
        rootFeatures: data ? data.length : 0,
        version: this.version,
        createdAt: metadata?.createdAt,
        lastModified: metadata?.lastModified,
        size: this.getStorageSize()
      }
    } catch (error) {
      console.error('Error getting database stats:', error)
      return null
    }
  }

  // Get approximate storage size
  getStorageSize() {
    try {
      const stored = localStorage.getItem(this.storeName)
      if (stored) {
        return new Blob([stored]).size
      }
      return 0
    } catch (error) {
      return 0
    }
  }

  // Create backup
  createBackup() {
    try {
      const backup = this.export()
      if (backup) {
        const backupKey = `${this.dbName}_backup_${Date.now()}`
        localStorage.setItem(backupKey, JSON.stringify(backup))
        return backupKey
      }
      return null
    } catch (error) {
      console.error('Error creating backup:', error)
      return null
    }
  }

  // List all backups
  listBackups() {
    try {
      const backups = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`${this.dbName}_backup_`)) {
          const timestamp = key.replace(`${this.dbName}_backup_`, '')
          backups.push({
            key,
            timestamp: parseInt(timestamp)
          })
        }
      }
      return backups.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Error listing backups:', error)
      return []
    }
  }

  // Restore from backup
  restore(backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey)
      if (backupData) {
        const parsed = JSON.parse(backupData)
        return this.import(parsed)
      }
      return false
    } catch (error) {
      console.error('Error restoring backup:', error)
      return false
    }
  }
}

// Create singleton instance
const db = new LocalDatabase()

export default db


