import { Spinner } from "../Spinner"
import { Skeleton } from "../Skeleton"
import { LoadingOverlay } from "../LoadingOverlay"

export function LoadingDemo() {
  return (
    <div className="space-y-8 p-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold">Spinner Variants</h2>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs text-muted-foreground">Small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <span className="text-xs text-muted-foreground">Medium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-xs text-muted-foreground">Large</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Skeleton Variants</h2>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Text (Pulse)</p>
            <Skeleton variant="text" width={200} animation="pulse" />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Text (Wave)</p>
            <Skeleton variant="text" width={200} animation="wave" />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Rectangular</p>
            <Skeleton variant="rectangular" width={300} height={100} />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Circular</p>
            <Skeleton variant="circular" width={64} height={64} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Loading Overlay</h2>
        <LoadingOverlay isLoading={true} message="Loading data...">
          <div className="h-64 rounded-lg border bg-card p-4">
            <p className="text-muted-foreground">
              This content is behind the loading overlay
            </p>
          </div>
        </LoadingOverlay>
      </section>
    </div>
  )
}
