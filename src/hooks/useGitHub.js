import { useState, useCallback } from 'react'
import { readInventory, writeInventory } from '../services/github'

/**
 * useGitHub — manages the raw GitHub API read/write lifecycle.
 *
 * Tracks loading, error, and the current file SHA so callers
 * don't need to manage the SHA themselves.
 *
 * @returns {{ loading, error, sha, read, write }}
 */
export function useGitHub() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [sha, setSha]         = useState(null)

  /**
   * Reads inventory.json from GitHub.
   * Returns the parsed inventory object or null on error.
   */
  const read = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, sha: fileSha } = await readInventory()
      setSha(fileSha)
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Writes inventory to GitHub.
   * Automatically passes the current SHA and updates it on success.
   * Returns true on success, false on failure.
   *
   * @param {object} inventoryData
   */
  const write = useCallback(async (inventoryData) => {
    setLoading(true)
    setError(null)
    try {
      const newSha = await writeInventory(inventoryData, sha)
      setSha(newSha)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [sha])

  return { loading, error, sha, read, write }
}
