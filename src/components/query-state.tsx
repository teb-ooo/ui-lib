import type { ReactNode } from "react";
import { describeError } from "@teb-ooo/web";
import { Button } from "./button";
import { Delayed } from "./delayed";

export interface ErrorStateProps {
  /** The sentence for a person: `describeError(error)` or `ApiError.userMessage`, never a raw `Error` message. */
  message: ReactNode;
  /** Adds the retry button, usually the query's `refetch`. */
  onRetry?: () => void;
  /** @default "Retry" */
  retryLabel?: string;
}

/** The error of a data screen: a danger line that is announced, and the way to try again. `DataTable` draws this for its `error`. */
export function ErrorState({ message, onRetry, retryLabel = "Retry" }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-start gap-2 p-4">
      <div role="alert" className="text-danger">
        {message}
      </div>
      {onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
    </div>
  );
}

/** The part of a TanStack Query result that `QueryState` reads, so any query result fits. */
export interface QueryLike<T> {
  data: T | undefined;
  error: unknown;
  isPending: boolean;
  refetch?: () => unknown;
}

export interface QueryStateProps<T> {
  /** The result of `useQuery` or `api.useQuery`. */
  query: QueryLike<T>;
  /** The loaded screen, drawn once there is data (and again with the old data when a later refresh fails). */
  children: (data: T) => ReactNode;
  /** What counts as empty. Default: an empty array, or an object whose `items` is an empty array. */
  isEmpty?: (data: T) => boolean;
  /** Shown when `isEmpty`. Say why it is empty: `EmptyState`. Without it an empty result draws `children` as usual. */
  empty?: ReactNode;
  /** The loading line, delayed 100ms so a fast response never flashes it. @default "Loading." */
  loading?: ReactNode;
  /** Label of the retry button. @default "Retry" */
  retryLabel?: string;
  /** Turns the error into a sentence. @default `describeError` from `@teb-ooo/web` */
  describe?: (error: unknown) => ReactNode;
}

function defaultIsEmpty(data: unknown): boolean {
  if (Array.isArray(data)) return data.length === 0;
  const items = (data as { items?: unknown } | null)?.items;
  return Array.isArray(items) && items.length === 0;
}

/**
 * The four states of a data screen over a query result: loading, error (with Retry), empty, loaded. Use it for any
 * screen that is not a `DataTable` (a table already draws the same three states from its own props). A failed refresh
 * of data already on screen keeps the data; only a first load can show the error.
 */
export function QueryState<T>({ query, children, isEmpty = defaultIsEmpty, empty, loading = "Loading.", retryLabel, describe = describeError }: QueryStateProps<T>) {
  const { data, error, isPending, refetch } = query;
  if (data === undefined && error != null) {
    return <ErrorState message={describe(error)} onRetry={refetch ? () => void refetch() : undefined} retryLabel={retryLabel} />;
  }
  if (isPending || data === undefined) {
    return (
      <Delayed role="status" className="p-4 text-ink-muted">
        {loading}
      </Delayed>
    );
  }
  if (empty !== undefined && isEmpty(data)) return <>{empty}</>;
  return <>{children(data)}</>;
}
