/**
 * Login Screen Component
 *
 * This component handles user authentication via Kakao social login.
 * It provides a simple interface for users to sign in using their Kakao account.
 */
import type { Route } from "./+types/login";

import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

import { SignInButtons } from "../components/auth-login-buttons";

/**
 * Meta function for the login page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Log in | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Login Component
 *
 * This component renders the login interface with Kakao authentication option.
 * It provides a simple interface for users to sign in using their Kakao account.
 */
export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold">
            Sign into your account
          </CardTitle>
          <CardDescription className="text-base">
            Please sign in with your Kakao account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SignInButtons />
        </CardContent>
      </Card>
      <div className="flex flex-col items-center justify-center text-sm">
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/join"
            viewTransition
            data-testid="form-signup-link"
            className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
