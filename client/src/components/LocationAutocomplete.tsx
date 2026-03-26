import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { usePersistFn } from "@/hooks/usePersistFn";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

function loadMapScript() {
  return new Promise(resolve => {
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve(null);
      return;
    }
    
    // Check if script is already loading
    const existingScript = document.querySelector(`script[src*="${MAPS_PROXY_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(null));
      return;
    }

    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=places`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      resolve(null);
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
    };
    document.head.appendChild(script);
  });
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (city: string, state: string, zip: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter city",
  className,
  error
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const initAutocomplete = usePersistFn(async () => {
    await loadMapScript();
    setIsScriptLoaded(true);
    
    if (!inputRef.current || !window.google) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'], // Allow addresses and cities to get zip codes
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place || !place.address_components) return;

      let city = '';
      let state = '';
      let zip = '';

      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.short_name.toLowerCase();
        }
        if (types.includes('postal_code')) {
          zip = component.long_name;
        }
      }

      // Fallback for city if locality is missing (e.g. some neighborhoods)
      if (!city) {
        for (const component of place.address_components) {
          const types = component.types;
          if (types.includes('sublocality_level_1')) {
            city = component.long_name;
            break;
          }
        }
      }

      if (city && state) {
        onSelect(city, state, zip);
      }
    });
  });

  useEffect(() => {
    initAutocomplete();
  }, [initAutocomplete]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
}
