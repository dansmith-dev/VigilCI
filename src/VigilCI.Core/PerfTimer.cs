namespace VigilCI.Core;

/// <summary>
/// Public API for use inside test methods to mark measured segments.
/// </summary>
public static class PerfTimer
{
    /// <summary>
    /// Marks the start of a measured segment. Dispose to stop measuring.
    /// Usage: using (PerfTimer.Measure("calculation")) { ... }
    /// </summary>
    public static IDisposable Measure(string segmentName) => PerformanceContext.Measure(segmentName);
}
