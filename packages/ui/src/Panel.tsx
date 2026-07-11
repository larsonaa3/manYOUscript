import type { HTMLAttributes, ReactNode } from "react";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
}

export function Panel({ title, children, ...rest }: PanelProps) {
  return (
    <div className="myc-panel" {...rest}>
      {title ? <div className="myc-panel__title">{title}</div> : null}
      <div className="myc-panel__body">{children}</div>
    </div>
  );
}
