import type { LoaderFunctionArgs } from "react-router";

export interface Route {
  LoaderArgs: LoaderFunctionArgs;
  LoaderData: {
    placeholder: string;
  };
}

