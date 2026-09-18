/**
 * useTransaction
 * Wraps any contract write call with loading, success, and error states.
 * Automatically shows toast notifications.
 */
import { useState, useCallback } from 'react'
import { parseContractError } from '../blockchain/contract'
import { useWeb3 } from '../context/Web3Context'

export function useTransaction() {
  const { addToast } = useWeb3()
  const [isPending,  setIsPending]  = useState(false)
  const [txHash,     setTxHash]     = useState(null)
  const [txError,    setTxError]    = useState(null)
  const [txSuccess,  setTxSuccess]  = useState(false)

  const reset = useCallback(() => {
    setIsPending(false)
    setTxHash(null)
    setTxError(null)
    setTxSuccess(false)
  }, [])

  /**
   * @param {Function} contractFn  — async function that calls a write contract method
   * @param {string}   successMsg  — message shown on success
   * @returns {Promise<any>}        receipt from tx.wait()
   */
  const execute = useCallback(async (contractFn, successMsg = 'Transaction confirmed!') => {
    reset()
    setIsPending(true)
    addToast('Waiting for MetaMask confirmation…', 'info', 3000)
    try {
      const receipt = await contractFn()
      setTxHash(receipt?.hash || receipt?.transactionHash || null)
      setTxSuccess(true)
      addToast(successMsg, 'success')
      return receipt
    } catch (err) {
      const msg = parseContractError(err)
      setTxError(msg)
      addToast(msg, 'error', 8000)
      throw err
    } finally {
      setIsPending(false)
    }
  }, [addToast, reset])

  return { isPending, txHash, txError, txSuccess, execute, reset }
}
