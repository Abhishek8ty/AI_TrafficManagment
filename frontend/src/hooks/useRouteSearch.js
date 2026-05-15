import { useCallback, useRef } from 'react'
import axios from 'axios'
import useTrafficStore from '../store/trafficStore'

export function useRouteSearch() {
  const { setSearching, setRouteData, setSearchError } = useTrafficStore()
  const abortRef = useRef(null)

  const search = useCallback(async (origin, destination) => {
    if (!origin || !destination) return

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setSearching(true)
    setSearchError(null)

    try {
      const res = await axios.get('/api/route/search', {
        params: { origin, destination },
        signal: abortRef.current.signal,
        timeout: 20000,
      })
      setRouteData(res.data)
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setSearchError(err.response?.data?.error || 'Search failed. Check your connection.')
        setSearching(false)
      }
    }
  }, [setSearching, setRouteData, setSearchError])

  return { search }
}
