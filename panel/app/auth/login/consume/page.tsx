import { loginWithToken } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export default async function ConsumeLoginPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token || "";
  await loginWithToken(token);
  return null;
}
