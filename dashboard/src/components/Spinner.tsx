import './Spinner.css';

interface SpinnerProps {
    message?: string;
}

function Spinner({ message }: SpinnerProps) {
    return (
        <div className="spinner-container">
            <div className="spinner" />
            {message && <p className="spinner-message">{message}</p>}
        </div>
    );
}

export default Spinner;
