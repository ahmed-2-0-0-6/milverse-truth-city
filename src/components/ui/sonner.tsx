import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      theme="dark"
      position="bottom-right"
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/70 group-[.toaster]:rounded-xl group-[.toaster]:shadow-2xl group-[.toaster]:elev-3 group-[.toaster]:backdrop-blur",
          title: "group-[.toast]:font-medium group-[.toast]:tracking-tight",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
          success: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary",
          error: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-destructive",
          info: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary/60",
          warning: "group-[.toaster]:border-l-4 group-[.toaster]:border-l-yellow-500/70",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
