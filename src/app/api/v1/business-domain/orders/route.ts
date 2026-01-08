import { NextResponse } from 'next/server'
import { createOrder } from '@/app/store/[businessId]/checkout/actions'

export async function POST(req: Request) {
  try {
      console.error('request reached target')
            const payload = await req.json()
                      const result = await createOrder(payload)
                                    return NextResponse.json(result)
                                                    } catch (e: any) {
                                                                        return NextResponse.json(
                                                                                                  { success: false, error: e.message },
                                                                                                                                  { status: 500 }
                                                                                                                                                                      )
                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                  }