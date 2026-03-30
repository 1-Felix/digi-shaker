import ConnectionIndicator from "./components/ConnectionIndicator";
import StatusPanel from "./components/StatusPanel";
import TuningPanel from "./components/TuningPanel";
import EncounterTracker from "./components/EncounterTracker";
import CalibrationPanel from "./components/CalibrationPanel";
import HistoryPanel from "./components/HistoryPanel";
import Toasts from "./components/Toasts";

export default function App() {
  return (
    <div class="app">
      <header class="header">
        <h1>Digi-Shaker</h1>
        <ConnectionIndicator />
      </header>

      <StatusPanel />
      <EncounterTracker />
      <TuningPanel />
      <CalibrationPanel />
      <HistoryPanel />
      <Toasts />
    </div>
  );
}
