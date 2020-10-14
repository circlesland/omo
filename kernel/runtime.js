import { NewRuntimeInstance } from "./_other/newRuntimeInstance";
import { RemovedRuntimeInstance } from "./_other/removedRuntimeInstance";
import { DeviceClass } from "./interfaces/component";
export const runtime = {
    _instances: {},
    _topics: {},
    register(id, instance) {
        this._instances[id] = instance;
        this._topics[id] = window.eventBroker.createTopic("omo", id);
        window.trigger(new NewRuntimeInstance(id, instance));
        return this._topics[id].observable;
    },
    find(id) {
        return this._instances[id];
    },
    remove(id) {
        delete this._instances[id];
        window.eventBroker.removeTopic("omo", id);
        window.trigger(new RemovedRuntimeInstance(id));
    },
    getDeviceClass() {
        if (window.innerWidth <= 600)
            return DeviceClass.mobile;
        else if (window.innerWidth <= 1024)
            return DeviceClass.tablet;
        else
            return DeviceClass.desktop;
    },
    _clone(obj) {
        const json = JSON.stringify(obj);
        const clone = JSON.parse(json);
        return clone;
    },
    findComponentDefinition(component) {
        function collectProperties(obj) {
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
            const deviceClass = self.getDeviceClass();
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
        Object.keys(deviceProperties).forEach((o) => (componentProperties[o] = deviceProperties[o]));
        return componentProperties;
    }
};
//# sourceMappingURL=runtime.js.map