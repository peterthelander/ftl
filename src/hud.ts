import type { DomElements } from './dom';
import { getSpeedRatio, getTravelMode } from './flight';

export function updateHud(dom: DomElements, currentSpeed: number) {
  const speedRatio = getSpeedRatio(currentSpeed);

  dom.speedDisplay.innerText = currentSpeed.toLocaleString(undefined, { maximumFractionDigits: 0 });
  dom.speedCDisplay.innerText = speedRatio.toLocaleString(undefined, { maximumFractionDigits: 2 });
  dom.travelModeDisplay.innerText = getTravelMode(speedRatio);
}
