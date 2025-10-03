import { render, type RenderOptions } from "@builder.io/qwik";
import Root from "./root";

export default function (opts: RenderOptions) {
  return render(document.getElementById("root") as any, <Root />, opts);
}
