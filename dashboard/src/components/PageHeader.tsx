import logo from '../assets/logo.svg';
import './PageHeader.css';

interface PageHeaderAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: PageHeaderAction[];
}

function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <header className="page-header">
            <div className="page-header-left">
                <img src={logo} alt="VigilCI" className="page-header-logo" />
                <div>
                    <h1 className="page-header-title">{title}</h1>
                    {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
                </div>
            </div>
            {actions && actions.length > 0 && (
                <div className="page-header-actions">
                    {actions.map(action => (
                        <button
                            key={action.label}
                            className={`page-header-action ${action.variant === 'secondary' ? 'page-header-action--secondary' : ''}`}
                            onClick={action.onClick}
                            disabled={action.loading}
                        >
                            {action.loading && <span className="page-header-action-spinner" />}
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </header>
    );
}

export default PageHeader;
