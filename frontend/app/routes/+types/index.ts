import type { LoaderFunctionArgs, MetaFunctionArgs } from "react-router";
import type { User } from "~/types";

export interface Route {
  LoaderArgs: LoaderFunctionArgs;
  LoaderData: {
    user: User;
    navLinks: Array<{
      to: string;
      label: string;
      icon: string;
    }>;
  };
  MetaFunction: MetaFunctionArgs<Route.LoaderData, {}>
}

