using System.Diagnostics;
using System.Text.RegularExpressions;

namespace VigilCI.Core;

internal static partial class GitInfo
{
    private static string? _commit;
    private static string? _branch;
    private static string? _repository;
    private static bool _resolved;

    public static string Commit => Resolve(ref _commit,
        () => Environment.GetEnvironmentVariable("GITHUB_SHA") ?? RunGit("rev-parse HEAD"));

    public static string Branch => Resolve(ref _branch,
        () => Environment.GetEnvironmentVariable("GITHUB_REF_NAME") ?? RunGit("rev-parse --abbrev-ref HEAD"));

    public static string Repository => Resolve(ref _repository,
        () => Environment.GetEnvironmentVariable("GITHUB_REPOSITORY") ?? ParseRemoteUrl());

    private static string Resolve(ref string? cached, Func<string?> factory)
    {
        return cached ??= factory() ?? "unknown";
    }

    private static string? ParseRemoteUrl()
    {
        var url = RunGit("remote get-url origin");
        if (url is null) return null;

        var match = RepoPattern().Match(url);
        return match.Success ? $"{match.Groups[1].Value}/{match.Groups[2].Value}" : null;
    }

    private static string? RunGit(string arguments)
    {
        try
        {
            var psi = new ProcessStartInfo("git", arguments)
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process is null) return null;

            var output = process.StandardOutput.ReadToEnd().Trim();
            process.WaitForExit(3000);

            return process.ExitCode == 0 && output.Length > 0 ? output : null;
        }
        catch
        {
            return null;
        }
    }

    [GeneratedRegex(@"[:/]([^/]+)/([^/]+?)(?:\.git)?$")]
    private static partial Regex RepoPattern();
}
