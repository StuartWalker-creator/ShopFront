'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PaymentCallback() {
  const params = useSearchParams()
    const router = useRouter()

      useEffect(() => {
          const status = params.get('status')
              const transactionId = params.get('transaction_id')

                  if (status === 'successful' && transactionId) {
                        // call your placeOrder API here if needed
                              router.replace('/orders')
                                  } else {
                                        router.replace('/checkout?payment=failed')
                                            }
                                              }, [params, router])

                                                return <p>Processing payment…</p>
                                                }