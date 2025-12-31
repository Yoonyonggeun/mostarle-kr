/**
 * Authentication Login Buttons Module
 *
 * This module provides reusable components for rendering Kakao authentication options
 * in a consistent and styled manner. It supports Kakao social login for both
 * sign-in and sign-up flows.
 *
 * The components are designed to be used in both sign-in and sign-up flows with
 * consistent styling. Each button includes the provider's logo and descriptive text
 * to enhance usability.
 *
 * This modular approach allows for easy addition or removal of authentication methods
 * without modifying the main authentication screens.
 */
import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";

import { KakaoLogo } from "./logos/kakao";

/**
 * Generic authentication button component
 *
 * This component renders a consistent button for any authentication provider.
 * It includes the provider's logo and a standardized "Continue with [Provider]" text.
 * The button uses the outline variant for a clean look and links to the appropriate
 * authentication flow.
 *
 * @param logo - React node representing the provider's logo
 * @param label - Provider name (e.g., "Google", "Apple")
 * @param href - URL path to the authentication flow for this provider
 */
function AuthLoginButton({
  logo,
  label,
  href,
}: {
  logo: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Button
      variant="outline"
      className="inline-flex items-center justify-center gap-2"
      asChild
    >
      <Link to={href}>
        <span>{logo}</span>
        <span>Continue with {label}</span>
      </Link>
    </Button>
  );
}

/**
 * Social login authentication options
 *
 * This component renders a button for Kakao authentication provider.
 * The button uses the provider's official logo and links to the appropriate
 * OAuth flow. The styling is consistent while respecting the provider's
 * brand guidelines for their logo presentation.
 */
function SocialLoginButtons() {
  return (
    <AuthLoginButton
      logo={<KakaoLogo className="size-4 scale-125 dark:text-yellow-300" />}
      label="Kakao"
      href="/auth/social/start/kakao"
    />
  );
}

/**
 * Complete set of sign-in authentication options
 *
 * This exported component provides Kakao authentication option for the sign-in flow.
 *
 * Usage:
 * ```tsx
 * <SignInButtons />
 * ```
 */
export function SignInButtons() {
  return <SocialLoginButtons />;
}

/**
 * Authentication options for the sign-up flow
 *
 * This exported component provides Kakao authentication option specifically for the sign-up flow.
 *
 * Usage:
 * ```tsx
 * <SignUpButtons />
 * ```
 */
export function SignUpButtons() {
  return <SocialLoginButtons />;
}
