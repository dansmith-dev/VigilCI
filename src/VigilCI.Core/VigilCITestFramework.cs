using System.Reflection;
using Xunit.Internal;
using Xunit.Sdk;
using Xunit.v3;

namespace VigilCI.Core;

public class VigilCiTestFramework : XunitTestFramework
{
    protected override ITestFrameworkExecutor CreateExecutor(Assembly assembly)
        => new VigilCiExecutor(
            new XunitTestAssembly(Guard.ArgumentNotNull(assembly), null, assembly.GetName().Version));
}

internal sealed class VigilCiExecutor(IXunitTestAssembly assembly) : XunitTestFrameworkExecutor(assembly)
{
    public override async ValueTask RunTestCases(
        IReadOnlyCollection<IXunitTestCase> testCases,
        IMessageSink executionMessageSink,
        ITestFrameworkExecutionOptions executionOptions,
        CancellationToken cancellationToken)
    {
        await base.RunTestCases(testCases, executionMessageSink, executionOptions, cancellationToken);

        var results = PerformanceResultStore.Results;
        if (results.Count == 0) return;

        var token = Environment.GetEnvironmentVariable("VIGILCI_GITHUB_TOKEN");
        var gistId = Environment.GetEnvironmentVariable("VIGILCI_GIST_ID");
        if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(gistId)) return;

        try
        {
            await GistPublisher.PublishAsync(results, token, gistId);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VigilCI] Failed to publish results: {ex.Message}");
        }
    }
}
