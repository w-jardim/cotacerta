import { AuthProvider } from './features/auth/auth-context';
import { AppRoutes } from './app/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
