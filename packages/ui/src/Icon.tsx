import type { LucideIcon, LucideProps } from "lucide-react";

export interface IconProps extends Omit<LucideProps, "ref"> {
  icon: LucideIcon;
}

/**
 * Thin wrapper around lucide-react icons: sizes via the --myc-icon-size
 * token (see .myc-icon in app-shell/src/styles.css) and inherits text
 * color by default, so call sites don't need to think about sizing/color
 * individually.
 */
export function Icon({ icon: LucideIconComponent, className, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <LucideIconComponent
      className={className ? `myc-icon ${className}` : "myc-icon"}
      strokeWidth={strokeWidth}
      color="currentColor"
      {...rest}
    />
  );
}
