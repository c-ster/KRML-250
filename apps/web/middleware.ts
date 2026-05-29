import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/250/submit",
  "/250/swipe",
  "/250/predict",
  "/250/edit",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const token = request.cookies.get("krml250_token")?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/250/verify";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/250/submit", "/250/swipe", "/250/predict", "/250/edit"],
};
