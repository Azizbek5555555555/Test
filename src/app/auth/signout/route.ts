import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch {
    // sozlanmagan bo'lsa ham bosh sahifaga qaytaramiz
  }
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
