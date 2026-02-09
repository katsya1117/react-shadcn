import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// shadcn/sonner ラッパー
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      richColors
      closeButton
      toastOptions={{ duration: 2400 }}
      style={{
        left: "50%",
        transform: "translateX(calc(-50% + var(--sidebar-offset, 120px)))",
      }}
      {...props}
    />
  );
}

export { toast } from "sonner";
