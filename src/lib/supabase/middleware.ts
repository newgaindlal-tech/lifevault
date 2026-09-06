import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 重要: Session verify करने के लिए getUser() का उपयोग
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith('/auth/login') ||
    pathname.startsWith('/auth/signup') ||
    pathname.startsWith('/auth/forgot-password');

  const isProtectedPage =
    pathname === '/' ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/items') ||
    pathname.startsWith('/settings');

  // 1. अगर यूज़र लॉग-इन नहीं है और प्रोटेक्टेड पेज खोल रहा है -> लॉगिन पर भेजो
  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // 2. अगर यूज़र पहले से लॉग-इन है और लॉगिन पेज खोल रहा है -> डैशबोर्ड भेजो
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}