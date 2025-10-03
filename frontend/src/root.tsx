import { component$ } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        {/* Runtime config injected by entrypoint.sh - MUST load before any modules */}
        <script src="/config.js" />
        {/* Fallback initialization if config.js fails to load */}
        <script dangerouslySetInnerHTML={`
          window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
          console.log('[Root] Config initialized:', window.__APP_CONFIG__);
        `} />
      </head>
      <body>
        <RouterOutlet />
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
});
