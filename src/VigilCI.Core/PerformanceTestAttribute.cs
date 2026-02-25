using Xunit;
using Xunit.v3;

namespace VigilCI.Core;

/// <summary>
/// Marks a test method as a performance test. The method is executed <see cref="Runs"/> times
/// and timing statistics (avg/min/max) are collected for each measured segment.
/// Results are published to a GitHub Gist when <c>VIGILCI_GITHUB_TOKEN</c> is set.
/// </summary>
[XunitTestCaseDiscoverer(typeof(PerformanceTestDiscoverer))]
[AttributeUsage(AttributeTargets.Method)]
public class PerformanceTestAttribute : FactAttribute
{
    /// <summary>
    /// The number of times to execute the test method. Must be at least 1.
    /// </summary>
    public int Runs { get; }

    /// <summary>
    /// Marks a test method as a performance test.
    /// </summary>
    /// <param name="runs">Number of times to execute the test. Defaults to 1.</param>
    public PerformanceTestAttribute(int runs = 1)
    {
        if (runs < 1)
            throw new ArgumentOutOfRangeException(nameof(runs), "Runs must be at least 1");

        Runs = runs;
    }
}
