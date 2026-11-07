export type DomElements = {
  canvas: HTMLCanvasElement;
  systemStatus: HTMLDivElement;
  joystick: HTMLDivElement;
  joystickThumb: HTMLDivElement;
  brakeButton: HTMLButtonElement;
  speedDisplay: HTMLSpanElement;
  speedCDisplay: HTMLSpanElement;
  travelModeDisplay: HTMLSpanElement;
  altitudeDisplay: HTMLSpanElement;
  altitudeTargetDisplay: HTMLSpanElement;
  controlsHelp: HTMLDivElement;
  atmosphereOverlay: HTMLDivElement;
  labelsOverlay: HTMLDivElement;
};

export function getRequiredElement<T extends HTMLElement>(id: string) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element as T;
}

export function getDomElements(): DomElements {
  return {
    canvas: getRequiredElement<HTMLCanvasElement>('simCanvas'),
    systemStatus: getRequiredElement<HTMLDivElement>('systemStatus'),
    joystick: getRequiredElement<HTMLDivElement>('joystick'),
    joystickThumb: getRequiredElement<HTMLDivElement>('joystickThumb'),
    brakeButton: getRequiredElement<HTMLButtonElement>('brakeButton'),
    speedDisplay: getRequiredElement<HTMLSpanElement>('speedDisplay'),
    speedCDisplay: getRequiredElement<HTMLSpanElement>('speedCDisplay'),
    travelModeDisplay: getRequiredElement<HTMLSpanElement>('travelModeDisplay'),
    altitudeDisplay: getRequiredElement<HTMLSpanElement>('altitudeDisplay'),
    altitudeTargetDisplay: getRequiredElement<HTMLSpanElement>('altitudeTargetDisplay'),
    controlsHelp: getRequiredElement<HTMLDivElement>('controlsHelp'),
    atmosphereOverlay: getRequiredElement<HTMLDivElement>('atmosphereOverlay'),
    labelsOverlay: getRequiredElement<HTMLDivElement>('labelsOverlay')
  };
}
