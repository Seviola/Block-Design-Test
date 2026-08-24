import { Component } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-card p-6 gap-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900 p-6">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h1 className="text-xl font-bold">Terjadi Kesalahan</h1>
            <p className="text-sm text-muted-foreground">
              Aplikasi mengalami error tak terduga. Data Anda tetap aman di server.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Muat Ulang Halaman
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
