export default function MyEventsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">My Events</h1>
          <p className="text-muted-foreground">
            View and manage the events you&apos;ve created or are attending.
          </p>
        </div>
      </div>
    </div>
  );
}
