export function EmptyState({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="status"
      className={
        className ?? "py-8 text-center text-sm text-muted-foreground"
      }
    >
      {children}
    </p>
  );
}
