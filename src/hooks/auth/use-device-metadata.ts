import { useEffect, useState } from "react";

import {
  fetchDeviceIP,
  getBrowserInfo,
  getPlatformFromUAParser,
  getReadableLocation,
} from "@/utils/helper";

export interface DeviceMetadata {
  ip: string;
  location: string;
  platform: string;
  browser: string;
}

export function useDeviceMetadata(): DeviceMetadata {
  const [metadata, setMetadata] = useState<DeviceMetadata>(() => ({
    ip: "",
    location: "",
    platform: getPlatformFromUAParser(),
    browser: getBrowserInfo(),
  }));

  useEffect(() => {
    let mounted = true;

    fetchDeviceIP()
      .then((ip) => {
        if (mounted) {
          setMetadata((current) => ({
            ...current,
            ip,
          }));
        }
      })
      .catch(console.error);

    getReadableLocation()
      .then((result) => {
        if (mounted && result.success && result.location) {
          setMetadata((current) => ({
            ...current,
            location: result.location!,
          }));
        }
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, []);

  return metadata;
}
