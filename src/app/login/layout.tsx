import { AuthImageBackground } from "@/components/auth/AuthImageBackground";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <AuthImageBackground>{children}</AuthImageBackground>;
}
