"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      visibleToasts={3}
      toastOptions={{
        duration: 4500,
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: null,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--white)",
          "--normal-text": "var(--black)",
          "--normal-border": "var(--faded)",
          "--success-bg": "#f4fbeb",
          "--success-text": "#2f4f00",
          "--success-border": "var(--green)",
          "--error-bg": "#fff4f4",
          "--error-text": "#6b1011",
          "--error-border": "var(--red)",
          "--warning-bg": "#fff8ee",
          "--warning-text": "#7a4a00",
          "--warning-border": "var(--orange)",
          "--info-bg": "#effbfe",
          "--info-text": "#074c5b",
          "--info-border": "var(--blue)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
