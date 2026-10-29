"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"

type LoginForm = {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState("")
  const { login, completeMfaLogin } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const finishLogin = () => {
    toast.success("Login successful!")

    // Check if there's a redirect parameter
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirect')

    // Redirect to the original page or the Illoura orders page
    router.push(redirect || "/admin/ellora/orders")
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)

    try {
      const result = await login(data.username, data.password)
      if (result.mfaRequired && result.mfaToken) {
        setMfaToken(result.mfaToken)
        return
      }
      finishLogin()
    } catch (error: any) {
      const errorMessage = error?.message || error.response?.data?.message || "Login failed. Please check your credentials."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaToken || !mfaCode.trim()) return
    setIsLoading(true)

    try {
      await completeMfaLogin(mfaToken, mfaCode.trim())
      finishLogin()
    } catch (error: any) {
      const message = error?.message || "Verification failed"
      toast.error(message)
      setMfaCode("")
      // Challenge expired: start over from the password step
      if (/expired|sign in again/i.test(message)) setMfaToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative"
      style={{
        backgroundImage: 'url(/assets/log.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay for readability */}

      <Card className="w-full max-w-md shadow-2xl relative z-10" style={{ borderRadius: '16px' }}>
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <img
              src="/assets/pulse-logo.png"
              alt="Pulse on Green Logo"
              className="h-28 w-auto"
            />
          </div>

          <div>
            <CardTitle className="text-3xl font-bold text-gray-800">Admin Portal</CardTitle>
            <CardDescription className="text-base mt-2">
              {mfaToken
                ? "Enter the 6-digit code from your authenticator app, or a backup code"
                : "Enter your credentials to access the dashboard"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {mfaToken ? (
            <form onSubmit={onVerify} className="space-y-5">
              <Input
                id="mfa-code"
                type="text"
                inputMode="text"
                autoComplete="one-time-code"
                autoFocus
                maxLength={11}
                placeholder="123456"
                className="h-11 text-center tracking-widest"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                className="w-full h-11 text-white font-semibold"
                style={{ backgroundColor: '#243F2A' }}
                disabled={isLoading || !mfaCode.trim()}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-gray-500 hover:underline"
                onClick={() => {
                  setMfaToken(null)
                  setMfaCode("")
                }}
                disabled={isLoading}
              >
                Back to sign in
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="h-11"
                {...register("username", { required: "Username is required" })}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="h-11"
                {...register("password", { required: "Password is required" })}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-white font-semibold"
              style={{ backgroundColor: '#243F2A' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1A2E1E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#243F2A'}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

