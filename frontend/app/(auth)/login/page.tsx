"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, type LoginResponse } from "@/lib/api/auth"
import { ApiError } from "@/lib/api-client"

// Matches 22-validation-rules.md and the backend's auth.dto.ts exactly —
// keep these three in sync if the rule ever changes.
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginFormValues) {
    setServerError(null)

    try {
      const result: LoginResponse = await login(data.email, data.password)

      // Simplest possible storage to get the flow working end-to-end.
      // Worth revisiting later: httpOnly refresh-token cookie set by the
      // backend + access token kept in memory only, to reduce XSS exposure.
      localStorage.setItem("accessToken", result.accessToken)
      localStorage.setItem("refreshToken", result.refreshToken)

      if (result.user.mustChangePassword) {
        router.push("/change-password") // build this route later
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message)
      } else {
        setServerError("Unable to reach the server. Please try again.")
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-700 px-4">
      <Card className="w-full max-w-sm p-6">
        <CardHeader>
          <CardTitle>Enterprise Inventory BI</CardTitle>
          <CardDescription>Distribution & Warehouse Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </>
                  )}
                />
              </div>

              {serverError && <FieldError>{serverError}</FieldError>}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white h-10"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
