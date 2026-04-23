import { useState, useEffect } from "react";

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

export function useOrganizationCreationConfig(accessToken?: string) {
  const [config, setConfig] = useState<OrganizationCreationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
    let mounted = true;

    fetch(`${API_URL}/api/creation-config/prerequisites/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
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
