'use client'
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (qrCode: string) => void
  onError?: (error: string) => void
  active?: boolean
}

export default function QRScanner({ onScan, onError, active = true }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)
  const lastScanRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        const now = Date.now()
        if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 3000) return
        lastScanRef.current = decodedText
        lastScanTimeRef.current = now
        onScan(decodedText)
      },
      undefined
    ).then(() => setStarted(true)).catch(err => onError?.(String(err)))
    return () => {
      startedRef.current = false
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {})
    }
  }, [active])

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      <div id="qr-reader" ref={containerRef} style={{ borderRadius: 12, overflow: 'hidden' }} />
      {!started && <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 12 }}>Starting camera...</p>}
    </div>
  )
}
