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
                No VigilCI results gist was found. To start tracking performance in your .NET projects, follow the setup guide.
            </p>
            <a
                className="setup-banner-link"
                href="https://github.com/dansmith-dev/VigilCI#quick-start"
                target="_blank"
                rel="noopener noreferrer"
            >
                View setup guide on GitHub →
            </a>
        </div>
    );
}

export default SetupBanner;
