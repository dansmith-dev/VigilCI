using System.Collections.Concurrent;

namespace VigilCI.Core;

public record PerformanceResult(
    string TestName,
    string FullyQualifiedName,
    DateTimeOffset Timestamp,
    string Commit,
    string Branch,
    int Runs,
    string Repository,
    IReadOnlyList<AveragedSegment> Segments);

public static class PerformanceResultStore
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
            Commit: Environment.GetEnvironmentVariable("GITHUB_SHA") ?? "local",
            Branch: Environment.GetEnvironmentVariable("GITHUB_REF_NAME") ?? "local",
            Repository: Environment.GetEnvironmentVariable("GITHUB_REPOSITORY") ?? "local",
            Runs: runs,
            Segments: context.GetAverages());

        _results.Add(result);
    }
}
