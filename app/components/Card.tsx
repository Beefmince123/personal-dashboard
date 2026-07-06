import clsx from "clsx";
import type { ReactNode } from "react";

interface CardProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  dark?: boolean;
  children: ReactNode;
  className?: string;
}

export function Card({ title, icon, actions, dark, children, className }: CardProps) {
  return (
    <section
      className={clsx(
        "rounded-lg p-6 shadow-sm",
        dark ? "bg-gray-800 text-white" : "bg-white text-gray-900",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
