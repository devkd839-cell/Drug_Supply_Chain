/**
 * useContractData
 * Fetches read-only data from the contract.
 *
 * IMPORTANT: pass a stable function reference (defined outside the component
 * or wrapped in useCallback) to avoid infinite re-fetch loops.
 * If you need to pass an inline function, list its closure variables in deps.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { parseContractError } from '../blockchain/contract'

// All current consumers fetch contract lists and render them immediately with
// array operations such as `.map()` and `.filter()`. Start with an empty list
// so the first render is safe while the asynchronous call is still pending.
export function useContractData(fetchFn, deps = [], initialValue = []) {
  const [data,    setData]    = useState(initialValue)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Keep a ref to the latest fetchFn so we can call it without putting it in deps
  const fnRef = useRef(fetchFn)
  fnRef.current = fetchFn

  const run = useCallback(async () => {
    if (!fnRef.current) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current()
      setData(result)
    } catch (err) {
      console.error('[useContractData]', err)
      setError(parseContractError(err))
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { run() }, [run])

  return { data, loading, error, refetch: run }
}
