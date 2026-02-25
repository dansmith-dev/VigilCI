namespace VigilCI.Core;

/// <summary>
/// Aggregated timing statistics for a single named segment across all runs.
/// </summary>
/// <param name="Name">The segment name passed to <see cref="PerfTimer.Measure"/>.</param>
/// <param name="AverageMs">Mean duration in milliseconds across all runs.</param>
/// <param name="MinMs">Shortest duration in milliseconds across all runs.</param>
/// <param name="MaxMs">Longest duration in milliseconds across all runs.</param>
/// <param name="Runs">Number of runs that contributed to these statistics.</param>
public record AveragedSegment(string Name, double AverageMs, double MinMs, double MaxMs, int Runs);
