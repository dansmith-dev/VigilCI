import './SetupBanner.css';

interface SetupBannerProps {
    onDismiss: () => void;
}

function SetupBanner({ onDismiss }: SetupBannerProps) {
    return (
        <div className="setup-banner">
            <div className="setup-banner-header">
                <div className="setup-banner-title-row">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <h3>Get started with VigilCI</h3>
                </div>
                <button className="setup-banner-dismiss" onClick={onDismiss} title="Dismiss">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            <p className="setup-banner-description">
                No VigilCI results gist was found. Follow these steps to start tracking performance in your .NET projects:
            </p>
            <ol className="setup-banner-steps">
                <li>
                    <strong>Install the NuGet package</strong> in your test project:
                    <code>dotnet add package VigilCI.Core</code>
                </li>
                <li>
                    <strong>Add a performance test</strong> using the <code>[PerformanceTest]</code> attribute:
                    <pre>{`[PerformanceTest(runs: 5)]
                        public void MyTest()
                        {
                            using (PerfTimer.Measure("work"))
                            {
                                // code to measure
                            }
                        }`}
                    </pre>
                </li>
                <li>
                    <strong>Create a GitHub Personal Access Token</strong> with the <code>gist</code> scope at{' '}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
                        github.com/settings/tokens
                    </a>
                </li>
                <li>
                    <strong>Add the token</strong> as a repository secret named <code>VIGILCI_GITHUB_TOKEN</code> in your repo's Settings &gt; Secrets &gt; Actions
                </li>
                <li>
                    <strong>Run your tests</strong> — VigilCI automatically creates a gist and publishes results. On the first run it will print the gist ID; save it as a <code>VIGILCI_GIST_ID</code> secret for subsequent runs.
                </li>
            </ol>
            <a
                className="setup-banner-link"
                href="https://github.com/dansmith-dev/VigilCI"
                target="_blank"
                rel="noopener noreferrer"
            >
                View full setup guide on GitHub →
            </a>
        </div>
    );
}

export default SetupBanner;
