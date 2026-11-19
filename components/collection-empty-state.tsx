import type { ReactNode } from "react";

type CollectionEmptyStateProps = {
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
  headingLevel?: "h2" | "h3";
};

export function CollectionEmptyState({ title, description, children, className = "", headingLevel = "h2" }: CollectionEmptyStateProps) {
  const Heading = headingLevel;

  return (
    <div className={`collection-empty${className ? ` ${className}` : ""}`}>
      <span aria-hidden="true">✦</span>
      <Heading>{title}</Heading>
      <p>{description}</p>
      {children}
    </div>
  );
}
