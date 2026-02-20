using Xunit;
using Xunit.v3;

namespace VigilCI.Core;

[XunitTestCaseDiscoverer(typeof(PerformanceTestDiscoverer))]
[AttributeUsage(AttributeTargets.Method)]
public class PerformanceTestAttribute : FactAttribute
{
    public int Runs { get; }

    public PerformanceTestAttribute(int runs = 1)
    {
        if (runs < 1)
            throw new ArgumentOutOfRangeException(nameof(runs), "Runs must be at least 1");

        Runs = runs;
    }
}
