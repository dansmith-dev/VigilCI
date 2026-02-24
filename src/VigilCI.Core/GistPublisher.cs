using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace VigilCI.Core;

public static class GistPublisher
{
    private static readonly HttpClient Http = CreateClient();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    public static async Task<string> PublishAsync(
        IReadOnlyCollection<PerformanceResult> results,
        string token,
        string? gistId = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(gistId))
        {
            gistId = await CreateGistAsync(token, results, ct);
            Console.WriteLine($"[VigilCI] Created new gist: {gistId}");
            Console.WriteLine($"[VigilCI] Set VIGILCI_GIST_ID={gistId} in your CI secrets to reuse it.");
            return gistId;
        }

        var existing = await FetchExistingResultsAsync(token, gistId, ct);
        existing.AddRange(results);
        await PatchGistAsync(token, gistId, existing, ct);
        return gistId;
    }

    private static async Task<string> CreateGistAsync(
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
                ["vigilci-results.json"] = new
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

        var body = await response.Content.ReadAsStringAsync(ct);
        var gist = JsonSerializer.Deserialize<JsonElement>(body, JsonOptions);
        return gist.GetProperty("id").GetString()!;
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

        var gistJson = await response.Content.ReadAsStringAsync(ct);
        var gist = JsonSerializer.Deserialize<JsonElement>(gistJson, JsonOptions);

        if (gist.TryGetProperty("files", out var files) &&
            files.TryGetProperty("vigilci-results.json", out var file) &&
            file.TryGetProperty("content", out var content))
        {
            var existing = JsonSerializer.Deserialize<List<PerformanceResult>>(
                content.GetString()!, JsonOptions);

            if (existing is not null)
                return existing;
        }

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
                ["vigilci-results.json"] = new
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