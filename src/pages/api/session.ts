import type { APIRoute } from "astro";
import { authSessionApi, ApiError } from "@/lib/api/api";

// Must be exactly "__session": Firebase Hosting strips every other cookie on
// its rewrite to Cloud Run, so this is the only name that survives to Astro SSR.
const SESSION_COOKIE_NAME = "__session";

export const POST: APIRoute = async ({ request, cookies }) => {
  const { idToken } = (await request.json().catch(() => ({}))) as {
    idToken?: string;
  };

  if (!idToken) {
    return new Response(JSON.stringify({ error: "idToken is required" }), {
      status: 400,
    });
  }

  try {
    const { sessionCookie, expiresIn } = await authSessionApi.create(idToken);

    cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresIn / 1000),
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return new Response(JSON.stringify({ error: "Failed to create session" }), {
      status: status || 500,
    });
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
