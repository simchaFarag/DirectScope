import { Component, type ReactNode } from 'react';
import { Button } from './ui';

/**
 * Last line of defence: a screen that throws used to leave a blank page that survived reloads (the bad state is kept
 * in localStorage). This shows a way out instead – reload from the server, or log out.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  private reload = () => {
    // the cached copy may be what breaks the screen – the server has the real data
    try {
      localStorage.removeItem('directscope.state.v3');
    } catch {
      /* storage unavailable */
    }
    window.location.assign('/app/home');
  };

  private logout = () => {
    try {
      localStorage.removeItem('directscope.state.v3');
      localStorage.removeItem('directscope.token');
    } catch {
      /* storage unavailable */
    }
    window.location.assign('/');
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 text-center" dir="rtl">
        <img src="/logo-mark.svg" alt="" width={56} height={56} />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-h3 font-bold">משהו השתבש בטעינת המסך</h1>
          <p className="text-body text-muted">הנתונים שלך שמורים. אפשר לטעון אותם מחדש מהשרת.</p>
        </div>
        <div className="flex w-full max-w-[314px] flex-col gap-3">
          <Button block onClick={this.reload}>
            טעינה מחדש
          </Button>
          <Button block variant="outline" onClick={this.logout}>
            התנתקות
          </Button>
        </div>
      </div>
    );
  }
}
