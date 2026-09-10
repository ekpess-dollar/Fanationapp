import { UAParser } from "ua-parser-js";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}
export interface LocationResult {
  success: boolean;
  code?: string;
  location?: string;
  error?: string;
  coords?: GeolocationCoords;
}

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

export const fetchDeviceIP = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Failed to fetch IP:", error);
    return "Unable to fetch IP";
  }
};

export const getGeolocation = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 0, message: "Geolocation not supported" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
};

export const getReadableLocation = async (): Promise<LocationResult> => {
  try {
    if (!navigator.geolocation) {
      return {
        success: false,
        code: "UNSUPPORTED",
        error: "Your browser does not support location access.",
      };
    }

    const coords = await getGeolocation();

    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
    );

    if (!response.ok) {
      return {
        success: false,
        code: "GEOCODE_FAILED",
        error: `Location service error (${response.status}). Please try again.`,
      };
    }

    const data = await response.json();

    const locationParts = [
      data.locality || data.city,
      data.principalSubdivision,
      data.countryName,
    ].filter(Boolean);

    const location =
      locationParts.length > 0
        ? locationParts.join(", ")
        : data.localityInfo?.administrative?.[0]?.name ||
          "Location unavailable";

    return { success: true, location, coords };
  } catch (error: any) {
    const code = error?.code;

    if (code === 1) {
      return {
        success: false,
        code: "PERMISSION_DENIED",
        error:
          "Location permission was denied. Please allow it to verify your email.",
      };
    }
    if (code === 2) {
      return {
        success: false,
        code: "POSITION_UNAVAILABLE",
        error:
          "We couldn’t detect your location. Turn on location services and try again.",
      };
    }
    if (code === 3) {
      return {
        success: false,
        code: "TIMEOUT",
        error: "Location request timed out. Please retry.",
      };
    }

    return {
      success: false,
      code: "UNKNOWN",
      error: error?.message || "An unexpected error occurred.",
    };
  }
};
