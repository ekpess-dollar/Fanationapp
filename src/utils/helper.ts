import { UAParser } from "ua-parser-js";

export const getDeviceOS = (): string => {
  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera;

  if (/windows phone/i.test(userAgent)) return "Windows Phone";
  if (/android/i.test(userAgent)) return "Android";
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream)
    return "iOS";

  switch (true) {
    case /Win/.test(userAgent):
      return "Windows";
    case /Mac/.test(userAgent):
      return "MacOS";
    case /Linux/.test(userAgent):
      return "Linux";
    default:
      return "Unknown OS";
  }
};

export const getPlatformFromUAParser = (): string => {
  const parser = new UAParser();
  return parser.getOS().name || "Unknown Platform";
};

export const getBrowserInfo = (): string => {
  const parser = new UAParser();
  const browser = parser.getBrowser();
  return `${browser.name || "Unknown"} ${browser.version || ""}`;
};
