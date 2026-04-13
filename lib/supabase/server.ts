import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** SSR client using anon key — respects RLS policies */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// Note: createServiceClient (service role key) intentionally NOT included here.
// The web app uses only the anon key — RLS policies enforce access control.
// Service role key is only used in local scripts (scripts/seed-supabase.ts).
