export const deineMudda = 1;

/*import OmoLogin from "./components/OmoLogin.svelte";

import { LayoutHeaderMain } from "./layouts/LayoutHeaderMain";
import { LayoutHeaderMainFooter } from "./layouts/LayoutHeaderMainFooter";
import { LayoutMain } from "./layouts/LayoutMain";
import { LayoutTopMainAside } from "./layouts/LayoutTopMainAside";
import { LayoutNavMain } from "./layouts/LayoutNavMain";
import { LayoutNav } from "./layouts/LayoutNav";

import type { Observable } from "rxjs";
import type { Trigger } from "./trigger/trigger";
import {
  Component,
  ComponentDefinition,
  DeviceClass,
} from "./interfaces/component";
import { NewRuntimeInstance } from "./trigger/shell/newRuntimeInstance";
import { RemovedRuntimeInstance } from "./trigger/shell/removedRuntimeInstance";

export const loader = {
  getComponentByName: (name) => {
    switch (name) {
      case "OmoLogin":
        return OmoLogin;
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
      const componentDefinition = loader.runtime.findComponentDefinition(
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
  },

  runtime: {
    _instances: {},
    _topics: {},
    register(id: string, instance: any): Observable<Trigger> {
      this._instances[id] = instance;
      this._topics[id] = window.eventBroker.createTopic("omo", id);

      window.trigger(new NewRuntimeInstance(id, instance));

      return this._topics[id].observable;
    },
    find(id: string): any {
      return this._instances[id];
    },
    remove(id: string) {
      delete this._instances[id];
      window.eventBroker.removeTopic("omo", id);
      window.trigger(new RemovedRuntimeInstance(id));
    },
    getDeviceClass(): DeviceClass {
      if (window.innerWidth <= 600) return DeviceClass.mobile;
      else if (window.innerWidth <= 1024) return DeviceClass.tablet;
      else return DeviceClass.desktop;
    },
    _clone(obj) {
      const json = JSON.stringify(obj);
      const clone = JSON.parse(json);
      return clone;
    },
    findComponentDefinition(component: Component): ComponentDefinition {
      function collectProperties(obj: Component | ComponentDefinition) {
        const skip = {
          [DeviceClass.mobile]: true,
          [DeviceClass.tablet]: true,
          [DeviceClass.desktop]: true,
        };

        const properties = {};
        Object.keys(obj)
          .filter((o) => !skip[o])
          .map((o) => {
            return { key: o, value: obj[o] };
          })
          .forEach((o) => (properties[o.key] = o.value));

        return properties;
      }

      const self = this;

      function findDeviceSpecificDefinition() {
        const deviceClass = loader.runtime.getDeviceClass();

        // Find a matching definition (searching from large to small)
        const sizeMap = [
          DeviceClass.mobile,
          DeviceClass.tablet,
          DeviceClass.desktop,
        ];
        let testSize = sizeMap.indexOf(deviceClass);

        for (let i = testSize; i >= 0; i--) {
          const definition = component[sizeMap[i]];
          if (definition) {
            return self._clone(definition);
          }
        }

        return null;
      }

      const deviceDefinition = findDeviceSpecificDefinition();
      const deviceProperties = deviceDefinition
        ? collectProperties(deviceDefinition)
        : {};
      const componentProperties = collectProperties(component);

      // Override all common properties with the device-specific value (if any)
      Object.keys(deviceProperties).forEach(
        (o) => (componentProperties[o] = deviceProperties[o])
      );

      return <any>componentProperties;
    },
  },
};
*/
