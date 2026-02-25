namespace VigilCI.Core;

internal class TestTimingContext
{
    private readonly int _totalRuns;
    private readonly List<List<TimingSegment>> _allRuns = new();
    private List<TimingSegment> _currentRun = new();

    public TestTimingContext(int totalRuns)
    {
        _totalRuns = totalRuns;
        _allRuns.Add(_currentRun);
    }

    public void BeginRun(int runIndex)
    {
        if (runIndex == 0) return;

        _currentRun = new List<TimingSegment>();
        _allRuns.Add(_currentRun);
    }

    public IDisposable StartSegment(string name)
    {
        var segment = new TimingSegment(name);
        _currentRun.Add(segment);
        return segment;
    }

    public void AddSegment(string name, TimeSpan elapsed)
    {
        _currentRun.Add(new TimingSegment(name, elapsed));
    }

    public IReadOnlyList<AveragedSegment> GetAverages()
    {
        return _allRuns
            .SelectMany(run => run)
            .GroupBy(s => s.Name)
            .Select(g => new AveragedSegment(
                g.Key,
                g.Average(s => s.Elapsed.TotalMilliseconds),
                g.Min(s => s.Elapsed.TotalMilliseconds),
                g.Max(s => s.Elapsed.TotalMilliseconds),
                g.Count()))
            .ToList();
    }
}
