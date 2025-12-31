/**
 * User Registration Screen Component
 *
 * This component handles new user registration via Kakao social authentication.
 * It provides a simple interface for users to create an account using their Kakao account.
 */
import type { Route } from "./+types/join";

import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

import { SignUpButtons } from "../components/auth-login-buttons";

/**
 * Meta function for the registration page
 *
 * Sets the page title using the application name from environment variables
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Create an account | ${import.meta.env.VITE_APP_NAME}`,
    },
  ];
};

/**
 * Registration Component
 *
 * This component renders the registration interface with Kakao authentication option.
 * It provides a simple interface for users to create an account using their Kakao account.
 */
export default function Join() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-semibold" role="heading">
            Create an account
          </CardTitle>
          <CardDescription className="text-base">
            Please sign up with your Kakao account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SignUpButtons />
        </CardContent>
      </Card>
      <div className="flex flex-col items-center justify-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            viewTransition
            data-testid="form-signin-link"
            className="text-muted-foreground hover:text-foreground text-underline underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
