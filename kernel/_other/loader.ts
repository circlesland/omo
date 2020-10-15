import Login from "../../views/molecules/login/Login.svelte";
import Blubb from "../../views/molecules/login/Blubb.svelte";

import { LayoutHeaderMain } from "../../views/layouts/LayoutHeaderMain";
import { LayoutHeaderMainFooter } from "../../views/layouts/LayoutHeaderMainFooter";
import { LayoutMain } from "../../views/layouts/LayoutMain";
import { LayoutTopMainAside } from "../../views/layouts/LayoutTopMainAside";
import { LayoutNavMain } from "../../views/layouts/LayoutNavMain";
import { LayoutNav } from "../../views/layouts/LayoutNav";

import type { Component } from "../interfaces/component";
import {runtime} from "../runtime";

export const loader = {
  getViewByName: (name) => {
    switch (name) {
      case "Login":
        return Login;
      case "Blubb":
        return Blubb;
    }
  },

  layout: {
    getLayoutByName: (name) => {
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
      throw new Error("Couldn't find layout with the name " + name);
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
