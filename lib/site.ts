export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${cleanPath}`;
}

export function withoutBasePath(pathname: string) {
  if (!BASE_PATH || !pathname.startsWith(BASE_PATH)) return pathname;
  return pathname.slice(BASE_PATH.length) || "/";
}
