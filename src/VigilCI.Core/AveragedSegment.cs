namespace VigilCI.Core;

public record AveragedSegment(string Name, double AverageMs, double MinMs, double MaxMs, int Runs);
