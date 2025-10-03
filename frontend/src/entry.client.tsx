import { render } from "@builder.io/qwik";
import Root from "./root";

// Provide minimal Qwik City environment data for client-only rendering
if (typeof window !== "undefined") {
  (window as any).qwikCityEnvData = {
    params: {},
    response: {
      status: 200,
      headers: new Headers(),
    },
    url: new URL(window.location.href),
  };
}

render(document.getElementById("root")!, <Root />);
