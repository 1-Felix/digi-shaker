import { For } from "solid-js";
import { toasts, dismissToast } from "../lib/ws";

export default function Toasts() {
  return (
    <div class="toast-container">
      <For each={toasts()}>
        {(toast) => (
          <div class={`toast toast-${toast.type}`} onClick={() => dismissToast(toast.id)}>
            {toast.message}
          </div>
        )}
      </For>
    </div>
  );
}
