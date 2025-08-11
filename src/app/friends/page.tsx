export default function FriendsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Friends</h1>
          <p className="text-muted-foreground">
            Connect with friends and see what events they&apos;re attending.
          </p>
        </div>
      </div>
    </div>
  );
}
