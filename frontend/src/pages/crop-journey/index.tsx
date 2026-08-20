export default function CropJourney() {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Crop Journey</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            No crops added yet
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            You can track your crop journey here once added.
          </p>
        </div>
      </div>
    </div>
  );
}
