import { Navigate } from 'react-router-dom';

// Forgot password is not applicable — authentication is via Google OAuth only.
// Redirect anyone who lands here back to the login page.
const ForgotPasswordPage = () => <Navigate to="/login" replace />;

export default ForgotPasswordPage;
