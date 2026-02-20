using Xunit.Sdk;
using Xunit.v3;

namespace VigilCI.Core;

public class PerformanceTestDiscoverer : IXunitTestCaseDiscoverer
{
    public ValueTask<IReadOnlyCollection<IXunitTestCase>> Discover(
        ITestFrameworkDiscoveryOptions discoveryOptions,
        IXunitTestMethod testMethod,
        IFactAttribute factAttribute)
    {
        var attr = (PerformanceTestAttribute)factAttribute;
        var details = TestIntrospectionHelper.GetTestCaseDetails(
            discoveryOptions, testMethod, factAttribute,
            testMethodArguments: null, timeout: null, baseDisplayName: null, label: null);

        var displayName = attr.Runs > 1
            ? $"{details.TestCaseDisplayName} (x{attr.Runs})"
            : details.TestCaseDisplayName;

        var traits = testMethod.Traits.ToDictionary(
            kvp => kvp.Key,
            kvp => new HashSet<string>(kvp.Value, StringComparer.OrdinalIgnoreCase),
            StringComparer.OrdinalIgnoreCase);

        var testCase = new PerformanceTestCase(
            details.ResolvedTestMethod,
            displayName,
            details.UniqueID,
            details.Explicit,
            attr.Runs,
            details.SkipExceptions,
            details.SkipReason,
            details.SkipType,
            details.SkipUnless,
            details.SkipWhen,
            traits,
            sourceFilePath: details.SourceFilePath,
            sourceLineNumber: details.SourceLineNumber,
            timeout: details.Timeout);

        return new ValueTask<IReadOnlyCollection<IXunitTestCase>>(new[] { testCase });
    }
}
