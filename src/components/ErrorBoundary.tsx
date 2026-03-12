import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oups, une erreur est survenue</h2>
                        <p className="text-gray-500 mb-6 text-sm">
                            Une erreur inattendue s'est produite. Essayez de rafraîchir la page.
                        </p>

                        {/* Technical details (optional, hidden by default or small) */}
                        {this.state.error && (
                            <details className="text-left bg-gray-50 p-3 rounded-lg mb-6 text-xs text-gray-500 overflow-auto max-h-32">
                                <summary className="cursor-pointer font-medium mb-1">Détails techniques</summary>
                                {this.state.error.toString()}
                            </details>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Rafraîchir la page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
