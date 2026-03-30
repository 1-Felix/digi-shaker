import { backendConnected, esp32Connected } from "../lib/ws";

export default function ConnectionIndicator() {
  const label = () => {
    if (!backendConnected()) return "Disconnected";
    if (!esp32Connected()) return "ESP32 Offline";
    return "Connected";
  };

  const color = () => {
    if (!backendConnected()) return "red";
    if (!esp32Connected()) return "yellow";
    return "green";
  };

  return (
    <div class="connection">
      <div class={`connection-dot ${color()}`} />
      <span>{label()}</span>
    </div>
  );
}
