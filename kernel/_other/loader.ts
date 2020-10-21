import TextileLogin from "../../views/molecules/login/TextileLogin.svelte";
import Blubb from "../../views/molecules/login/Blubb.svelte";
import ErrorView from "../../views/_other/ErrorView.svelte";
import GetTrust from "../../views/_other/GetTrust.svelte";
import Index from "../../views/_other/Index.svelte";
import Login from "../../views/_other/Login.svelte";
import Register from "../../views/_other/Register.svelte";
import Safe from "../../views/_other/Safe.svelte";
import TrustSomeone from "../../views/_other/TrustSomeone.svelte";
import UnlockSafe from "../../views/_other/UnlockSafe.svelte";
import { LayoutHeaderMain } from "../../views/layouts/LayoutHeaderMain";
import { LayoutHeaderMainFooter } from "../../views/layouts/LayoutHeaderMainFooter";
import { LayoutMain } from "../../views/layouts/LayoutMain";
import { LayoutTopMainAside } from "../../views/layouts/LayoutTopMainAside";
import { LayoutNavMain } from "../../views/layouts/LayoutNavMain";
import { LayoutNav } from "../../views/layouts/LayoutNav";

import type { Component } from "../interfaces/component";
import { runtime } from "../runtime";

export const loader = {
  getViewByName: (name) => {
    switch (name) {
      case "Login":
        return Login;
      case "Blubb":
        return Blubb;
      case "ErrorView":
        return ErrorView;
      case "GetTrust":
        return GetTrust;
      case "Index":
        return Index;
      case "Register":
        return Register;
      case "TextileLogin":
        return TextileLogin;
      case "Safe":
        return Safe;
      case "TrustSomeone":
        return TrustSomeone;
      case "UnlockSafe":
        return UnlockSafe;
    }
  },

  layout: {
    getLayoutByName: (name: string) => {
      switch (name) {
        case "LayoutHeaderMain":
          return LayoutHeaderMain;
        case "LayoutHeaderMainFooter":
          return LayoutHeaderMainFooter;
        case "LayoutMain":
          return LayoutMain;
        case "LayoutTopMainAside":
          return LayoutTopMainAside;
        case "LayoutNavMain":
          return LayoutNavMain;
        case "LayoutNav":
          return LayoutNav;
      }
      throw new Error("Couldn't find layout with the name ");
    },
    isAreaAvailable(layoutName: string, component: Component) {
      const layout = loader.layout.getLayoutByName(layoutName);
      const componentDefinition = runtime.findComponentDefinition(
        component
      );
      const availableAreas = this._getAreasFromString(layout.areas);
      const availableArea = availableAreas.find(
        (o) => o === componentDefinition.area
      );
      return availableArea;
    },
    _getAreasFromString(areas) {
      const strippedWhitespace =
        // Replace all single quotes with whitespaces ..
        areas
          .split("'")
          .join(" ")
          // .. then replaces all double whitespaces with single whitespaces
          .split("  ")
          .join(" ");

      const items = {};

      // De-duplicate all area names
      strippedWhitespace
        .split(" ")
        .filter((o) => o.trim() !== "")
        .forEach((o) => (items[o] = true));

      // Return them as array
      return Object.keys(items);
    },
  }
};
