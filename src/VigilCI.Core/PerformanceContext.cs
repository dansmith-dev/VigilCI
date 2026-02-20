namespace VigilCI.Core;

internal static class PerformanceContext
{
    private static readonly AsyncLocal<TestTimingContext?> Current = new();

    public static void Initialise(int runs) => Current.Value = new TestTimingContext(runs);

    public static void BeginRun(int runIndex) => Current.Value?.BeginRun(runIndex);

    public static IDisposable Measure(string segmentName) => Current.Value?.StartSegment(segmentName) ?? NoOpDisposable.Instance;

    public static TestTimingContext? Collect()
    {
        var ctx = Current.Value;
        Current.Value = null;
        return ctx;
    }

    private sealed class NoOpDisposable : IDisposable
    {
        public static readonly NoOpDisposable Instance = new();
        public void Dispose() { }
    }
}
