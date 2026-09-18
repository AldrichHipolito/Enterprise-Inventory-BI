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
import { changePassword, type ChangePasswordResponse } from "@/lib/api/auth"
import { ApiError } from "@/lib/api-client"


export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from your current password",
  path: ["newPassword"],
});

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
    const router = useRouter()
    const [serverError, setServerError] = useState<string | null>(null)

     const {
        control,
        handleSubmit,
        formState: { isSubmitting },
      } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { currentPassword: "", newPassword: "" },
      })

      async function onSubmit(data: ChangePasswordFormValues) {
        setServerError(null)
    
        try {
          const result: ChangePasswordResponse = await changePassword(data.currentPassword, data.newPassword)
    
          // Simplest possible storage to get the flow working end-to-end.
          // Worth revisiting later: httpOnly refresh-token cookie set by the
          // backend + access token kept in memory only, to reduce XSS exposure.
          // localStorage.setItem("accessToken", result.accessToken)
    
          if (result.message) {
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
                <Label htmlFor="password">Current Password</Label>
                <Controller
                  name="currentPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="currentPassword"
                        type="password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">New Password</Label>
                </div>
                <Controller
                  name="newPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        id="newPassword"
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
