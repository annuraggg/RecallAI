import { useState, useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";
import SharedConversationPage from "./pages/SharedConversationPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import BookmarksPage from "./pages/BookmarksPage";
import IntelligencePage from "./pages/IntelligencePage";
import { authAPI } from "./api/auth";

function ProtectedRoute({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function AuthRoute({
  onAuthSuccess,
  isAuthenticated,
}: {
  onAuthSuccess: () => void;
  isAuthenticated: boolean;
}) {
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <AuthPage onAuthSuccess={onAuthSuccess} />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    try {
      await fetch(`${API_BASE_URL}/auth/csrf/`, { credentials: "include" });
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
    }
    checkAuth();
  };

  const checkAuth = async () => {
    try {
      const user = await authAPI.getCurrentUser();
      setIsAuthenticated(user.is_authenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const router = createBrowserRouter([
    {
      path: "/auth",
      element: (
        <AuthRoute
          onAuthSuccess={handleAuthSuccess}
          isAuthenticated={isAuthenticated}
        />
      ),
    },
    {
      path: "/shared/:token",
      element: <SharedConversationPage />,
    },
    {
      path: "/chats/:conversationId?",
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <div className="flex h-screen">
            <ChatPage onLogout={handleLogout} />
          </div>
        </ProtectedRoute>
      ),
    },
    {
      path: "/intelligence",
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <div className="flex h-screen">
            <IntelligencePage onLogout={handleLogout} />
          </div>
        </ProtectedRoute>
      ),
    },
    {
      path: "/analytics",
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <div className="flex h-screen">
            <AnalyticsPage onLogout={handleLogout} />
          </div>
        </ProtectedRoute>
      ),
    },
    {
      path: "/bookmarks",
      element: (
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <div className="flex h-screen">
            <BookmarksPage onLogout={handleLogout} />
          </div>
        </ProtectedRoute>
      ),
    },
    {
      path: "/",
      element: isAuthenticated ? (
        <Navigate to="/chats" replace />
      ) : (
        <Navigate to="/auth" replace />
      ),
    },
  ]);

  if (isLoading) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="recallai-ui-theme">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="recallai-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
