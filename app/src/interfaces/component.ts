export enum DeviceClass {
  mobile = "mobile",
  tablet = "tablet",
  desktop = "desktop"
}

export type ComponentDefinition = {
  data?: any;
  component?: string;
  children?: Component[];
  area: string;
  /**
   * When set wraps a "<div>" element around the child component(s) and applies the cssClasses on it.
   */
  cssClasses?: string;
  layout?: string
}

export interface Component
{
  id?:string;
  /**
   * The following device classes exist: "mobile", "tablet" and "desktop".
   * The device classes are ordered from small to large ("mobile" -> "desktop").
   * If e.g. only "tablet" and "desktop" exists in the definition, "mobile" will
   * automatically fall back to the next larger "tablet".
   * Similar, if only "mobile" and "tablet" exists, "desktop" will fall back to the next smaller "tablet".
   */
  [deviceClass:string]: (ComponentDefinition|string|any|undefined)
}