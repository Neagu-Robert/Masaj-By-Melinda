import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-800 group-[.toaster]:text-white group-[.toaster]:border-gray-700 group-[.toaster]:shadow-lg data-[type=error]:group-[.toaster]:bg-red-900/80 data-[type=error]:group-[.toaster]:border-red-700 data-[type=error]:group-[.toaster]:text-white",
          description: "group-[.toast]:text-gray-300",
          actionButton:
            "group-[.toast]:bg-violet-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
