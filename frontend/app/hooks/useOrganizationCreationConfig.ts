import * as React from "react";

interface Prerequisite {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

interface OrganizationCreationConfig {
  prerequisites: Prerequisite[];
  can_create: boolean;
  helper_text: {
    title: string;
    description: string;
    warning: string;
  };
}

// Use Vite's import.meta.env or fallback to default
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export function useOrganizationCreationConfig(accessToken?: string) {
  const [config, setConfig] = React.useState<OrganizationCreationConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    let mounted = true;

    fetch(`${API_URL}/api/creation-config/prerequisites/`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (mounted) {
          setConfig(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  return { config, loading, error };
}
