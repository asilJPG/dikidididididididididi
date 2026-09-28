import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient(customCookieStore?: any) {
  const cookieStore = customCookieStore || cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return typeof cookieStore.getAll === "function"
            ? cookieStore.getAll()
            : [];
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (typeof cookieStore.set === "function") {
                cookieStore.set(name, value, options);
              }
            });
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
    }
  );
}
