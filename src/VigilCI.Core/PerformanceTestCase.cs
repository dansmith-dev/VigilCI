using System.Diagnostics;
using Xunit.Sdk;
using Xunit.v3;

namespace VigilCI.Core;

public class PerformanceTestCase : XunitTestCase, ISelfExecutingXunitTestCase
{
    public int Runs { get; private set; }

    [Obsolete("For deserialization only")]
    public PerformanceTestCase() { }

    public PerformanceTestCase(
        IXunitTestMethod testMethod,
        string testCaseDisplayName,
        string uniqueID,
        bool @explicit,
        int runs,
        Type[]? skipExceptions = null,
        string? skipReason = null,
        Type? skipType = null,
        string? skipUnless = null,
        string? skipWhen = null,
        Dictionary<string, HashSet<string>>? traits = null,
        string? sourceFilePath = null,
        int? sourceLineNumber = null,
        int? timeout = null)
        : base(
            testMethod, testCaseDisplayName, uniqueID, @explicit,
            skipExceptions, skipReason, skipType, skipUnless, skipWhen,
            traits, testMethodArguments: null,
            sourceFilePath: sourceFilePath, sourceLineNumber: sourceLineNumber,
            timeout: timeout)
    {
        Runs = runs;
    }

    protected override void Serialize(IXunitSerializationInfo info)
    {
        base.Serialize(info);
        info.AddValue(nameof(Runs), Runs);
    }

    protected override void Deserialize(IXunitSerializationInfo info)
    {
        base.Deserialize(info);
        Runs = info.GetValue<int>(nameof(Runs));
    }

    async ValueTask<RunSummary> ISelfExecutingXunitTestCase.Run(
        ExplicitOption explicitOption,
        IMessageBus messageBus,
        object?[] constructorArguments,
        ExceptionAggregator aggregator,
        CancellationTokenSource cancellationTokenSource)
    {
        PerformanceContext.Initialise(Runs);
        var totalStopwatch = Stopwatch.StartNew();

        var test = (await CreateTests()).First();

        var beforeAfterAttrs = TestMethod?.Method
            .GetCustomAttributes(true)
            .OfType<IBeforeAfterTestAttribute>()
            .ToArray() ?? [];

        var summary = new RunSummary();

        for (int i = 0; i < Runs; i++)
        {
            if (cancellationTokenSource.IsCancellationRequested)
                break;

            PerformanceContext.BeginRun(i);

            var isFirstRun = i == 0;
            var runSummary = await XunitTestRunner.Instance.Run(
                test,
                isFirstRun ? messageBus : SilentBus.Instance,
                constructorArguments,
                explicitOption,
                isFirstRun ? aggregator : new ExceptionAggregator(),
                cancellationTokenSource,
                beforeAfterAttrs);

            if (isFirstRun)
                summary = runSummary;

            if (runSummary.Failed > 0)
            {
                if (!isFirstRun) summary.Failed++;
                break;
            }
        }

        totalStopwatch.Stop();

        var context = PerformanceContext.Collect();
        if (context is not null)
        {
            context.AddSegment("total", totalStopwatch.Elapsed / Runs);

            PerformanceResultStore.Record(
                testName: TestMethodName ?? "",
                fullyQualifiedName: $"{TestClassName}.{TestMethodName}",
                runs: Runs,
                context: context);
        }

        return summary;
    }

    private sealed class SilentBus : IMessageBus
    {
        public static readonly SilentBus Instance = new();
        public bool QueueMessage(IMessageSinkMessage message) => true;
        public void Dispose() { }
    }
}
