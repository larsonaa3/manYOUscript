import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  children: ReactNode;
}

export function Button({ variant = "primary", children, ...rest }: ButtonProps) {
  const base = "myc-button";
  const variantClass = variant === "primary" ? "myc-button--primary" : "myc-button--ghost";
  return (
    <button className={`${base} ${variantClass}`} {...rest}>
      {children}
    </button>
  );
}
