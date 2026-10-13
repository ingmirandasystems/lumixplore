let loadingPromise: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (window.google) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      script.remove();
      loadingPromise = null;
      reject(new Error("No se pudo cargar el acceso con Google"));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}
