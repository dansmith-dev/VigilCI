using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace VigilCI.Core;

internal static class GistPublisher
{
    private const string ResultsFileName = "vigilci-results.json";

    private static readonly HttpClient Http = CreateClient();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public static async Task PublishAsync(
        IReadOnlyCollection<PerformanceResult> results,
        string token,
        string? gistId = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(gistId))
            gistId = await FindExistingGistAsync(token, ct);

        if (gistId is not null)
        {
            var existing = await FetchExistingResultsAsync(token, gistId, ct);
            existing.AddRange(results);
            await PatchGistAsync(token, gistId, existing, ct);
            return;
        }

        await CreateGistAsync(token, results, ct);
    }

    private static async Task<string?> FindExistingGistAsync(string token, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/gists?per_page=100");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await Http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) return null;

        try
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            var gists = JsonSerializer.Deserialize<JsonElement>(body, JsonOptions);

            if (gists.ValueKind != JsonValueKind.Array) return null;

            foreach (var gist in gists.EnumerateArray())
            {
                if (gist.TryGetProperty("files", out var files) &&
                    files.TryGetProperty(ResultsFileName, out _))
                {
                    return gist.GetProperty("id").GetString();
                }
            }
        }
        catch (JsonException) { }

        return null;
    }

    private static async Task CreateGistAsync(
        string token,
        IReadOnlyCollection<PerformanceResult> results,
        CancellationToken ct)
    {
        var payload = new
        {
            Description = "VigilCI Performance Results",
            Public = false,
            Files = new Dictionary<string, object>
            {
                [ResultsFileName] = new
                {
                    Content = JsonSerializer.Serialize(results, JsonOptions)
                }
            }
        };

        var json = JsonSerializer.Serialize(payload, JsonOptions);
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.github.com/gists");
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await Http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }

    private static async Task<List<PerformanceResult>> FetchExistingResultsAsync(
        string token,
        string gistId,
        CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"https://api.github.com/gists/{gistId}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await Http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        try
        {
            var gistJson = await response.Content.ReadAsStringAsync(ct);
            var gist = JsonSerializer.Deserialize<JsonElement>(gistJson, JsonOptions);

            if (gist.TryGetProperty("files", out var files) &&
                files.TryGetProperty(ResultsFileName, out var file) &&
                file.TryGetProperty("content", out var content))
            {
                var contentStr = content.GetString();
                if (contentStr is not null)
                {
                    var existing = JsonSerializer.Deserialize<List<PerformanceResult>>(contentStr, JsonOptions);
                    if (existing is not null)
                        return existing;
                }
            }
        }
        catch (JsonException) { }

        return new List<PerformanceResult>();
    }

    private static async Task PatchGistAsync(
        string token,
        string gistId,
        List<PerformanceResult> results,
        CancellationToken ct)
    {
        var payload = new
        {
            Files = new Dictionary<string, object>
            {
                [ResultsFileName] = new
                {
                    Content = JsonSerializer.Serialize(results, JsonOptions)
                }
            }
        };

        var json = JsonSerializer.Serialize(payload, JsonOptions);
        using var request = new HttpRequestMessage(HttpMethod.Patch,
            $"https://api.github.com/gists/{gistId}");
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await Http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
    }

    private static HttpClient CreateClient()
    {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("User-Agent", "VigilCI");
        client.DefaultRequestHeaders.Add("Accept", "application/vnd.github+json");
        client.Timeout = TimeSpan.FromSeconds(30);
        return client;
    }
}
