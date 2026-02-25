using System.Collections.Concurrent;

namespace VigilCI.Core;

/// <summary>
/// A single performance test result containing timing data and git metadata.
/// </summary>
/// <param name="TestName">Short name of the test method.</param>
/// <param name="FullyQualifiedName">Fully qualified name including class and method.</param>
/// <param name="Timestamp">UTC time when the result was recorded.</param>
/// <param name="Commit">Git commit SHA (from CI or local git).</param>
/// <param name="Branch">Git branch name (from CI or local git).</param>
/// <param name="Runs">Number of times the test was executed.</param>
/// <param name="Repository">Repository in <c>owner/name</c> format.</param>
/// <param name="Segments">Averaged timing statistics per measured segment.</param>
public record PerformanceResult(
    string TestName,
    string FullyQualifiedName,
    DateTimeOffset Timestamp,
    string Commit,
    string Branch,
    int Runs,
    string Repository,
    IReadOnlyList<AveragedSegment> Segments);

internal static class PerformanceResultStore
{
    private static readonly ConcurrentBag<PerformanceResult> _results = new();

    public static IReadOnlyCollection<PerformanceResult> Results => _results.ToArray();

    public static void Record(
        string testName,
        string fullyQualifiedName,
        int runs,
        TestTimingContext context)
    {
        var result = new PerformanceResult(
            TestName: testName,
            FullyQualifiedName: fullyQualifiedName,
            Timestamp: DateTimeOffset.UtcNow,
            Commit: GitInfo.Commit,
            Branch: GitInfo.Branch,
            Repository: GitInfo.Repository,
            Runs: runs,
            Segments: context.GetAverages());

        _results.Add(result);
    }
}
