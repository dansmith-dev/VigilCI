using System.Diagnostics;

namespace VigilCI.Core;

internal class TimingSegment : IDisposable
{
    private readonly Stopwatch? _sw;

    public TimingSegment(string name)
    {
        Name = name;
        _sw = Stopwatch.StartNew();
    }

    public TimingSegment(string name, TimeSpan elapsed)
    {
        Name = name;
        Elapsed = elapsed;
    }

    public string Name { get; }
    public TimeSpan Elapsed { get; private set; }

    public void Dispose()
    {
        if (_sw is not null)
        {
            _sw.Stop();
            Elapsed = _sw.Elapsed;
        }
    }
}
