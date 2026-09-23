import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-0 flex-1 flex-col overflow-auto outline-none"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <Card className="relative w-full max-w-lg gap-0 overflow-hidden rounded-lg bg-card py-0 ring-1 ring-foreground/10">
            <div className="scratcher-stripe h-1 w-full shrink-0" aria-hidden />
            <CardHeader className="gap-3 px-6 pt-6 pb-2">
              <Skeleton className="h-4 w-36 rounded-md bg-muted-foreground/10" />
              <Skeleton className="h-8 w-2/3 rounded-md bg-muted-foreground/15" />
              <Skeleton className="h-4 w-1/3 rounded-md bg-muted-foreground/10" />
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6">
              <Skeleton className="h-4 w-full rounded-md bg-muted-foreground/10" />
              <Skeleton className="h-4 w-5/6 rounded-md bg-muted-foreground/10" />
              <Skeleton className="h-4 w-4/6 rounded-md bg-muted-foreground/10" />
              <Skeleton className="mt-4 h-20 w-full rounded-md bg-muted-foreground/10" />
            </CardContent>
            <p role="status" aria-live="polite" className="sr-only">
              Loading...
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
