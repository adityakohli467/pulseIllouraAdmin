"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mfaAPI } from "@/lib/api"
import { toast } from "sonner"

type Step = "idle" | "scan" | "backup" | "disable"

export default function SecurityPage() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [step, setStep] = useState<Step>("idle")
  const [qr, setQr] = useState("")
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const loadStatus = useCallback(async () => {
    try {
      const res = await mfaAPI.status()
      setEnabled(res.data.enabled)
      setRemaining(res.data.backupCodesRemaining)
    } catch (e: any) {
      toast.error(e?.message || "Failed to load security settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const reset = () => {
    setStep("idle")
    setCode("")
    setPassword("")
    setQr("")
    setSecret("")
  }

  const startSetup = async () => {
    setBusy(true)
    try {
      const res = await mfaAPI.setup()
      setQr(res.data.qrCodeDataUrl)
      setSecret(res.data.secret)
      setCode("")
      setStep("scan")
    } catch (e: any) {
      toast.error(e?.message || "Could not start setup")
    } finally {
      setBusy(false)
    }
  }

  const confirmSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await mfaAPI.enable(code.trim())
      setBackupCodes(res.data.backupCodes)
      setStep("backup")
      setQr("")
      setSecret("")
      setCode("")
      await loadStatus()
      toast.success("Two-factor authentication enabled")
    } catch (e: any) {
      toast.error(e?.message || "Invalid code")
    } finally {
      setBusy(false)
    }
  }

  const disableMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await mfaAPI.disable(password, code.trim())
      toast.success("Two-factor authentication disabled")
      reset()
      await loadStatus()
    } catch (e: any) {
      toast.error(e?.message || "Could not disable")
    } finally {
      setBusy(false)
    }
  }

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"))
      toast.success("Backup codes copied")
    } catch {
      toast.error("Copy failed. Select and copy the codes manually.")
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Protect your account with a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : step === "backup" ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Save these backup codes somewhere safe. Each can be used once if you lose your phone. They will not be shown again.
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-md border bg-gray-50 p-4 font-mono text-sm">
                {backupCodes.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={copyBackupCodes}>
                  Copy codes
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setBackupCodes([])
                    setStep("idle")
                  }}
                >
                  I have saved them
                </Button>
              </div>
            </div>
          ) : step === "scan" ? (
            <form onSubmit={confirmSetup} className="space-y-4">
              <p className="text-sm text-gray-700">1. Scan this QR code with your authenticator app.</p>
              {qr && <img src={qr} alt="Authenticator QR code" className="mx-auto h-48 w-48" />}
              <p className="text-xs text-gray-500 break-all">
                Can&apos;t scan? Enter this key manually: <span className="font-mono">{secret}</span>
              </p>
              <p className="text-sm text-gray-700">2. Enter the 6-digit code it shows.</p>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                className="text-center tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={busy}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={busy || code.length !== 6}>
                  {busy ? "Verifying..." : "Enable"}
                </Button>
                <Button type="button" variant="outline" onClick={reset} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : step === "disable" ? (
            <form onSubmit={disableMfa} className="space-y-4">
              <p className="text-sm text-gray-700">
                Confirm with your password and a current authenticator or backup code.
              </p>
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              <Input
                autoComplete="one-time-code"
                maxLength={11}
                placeholder="Authenticator or backup code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={busy}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" disabled={busy || !password || !code.trim()}>
                  {busy ? "Disabling..." : "Disable"}
                </Button>
                <Button type="button" variant="outline" onClick={reset} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                Status:{" "}
                <span className={enabled ? "font-semibold text-green-700" : "font-semibold text-gray-600"}>
                  {enabled ? "Enabled" : "Not enabled"}
                </span>
              </p>
              {enabled && <p className="text-sm text-gray-600">Unused backup codes: {remaining}</p>}
              {enabled ? (
                <Button variant="outline" onClick={() => setStep("disable")}>
                  Disable
                </Button>
              ) : (
                <Button onClick={startSetup} disabled={busy}>
                  {busy ? "Preparing..." : "Set up authenticator app"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
