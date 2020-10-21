<script lang="ts">
  import type { Component, ComponentDefinition} from "../interfaces/component";
  import type { Trigger } from "../interfaces/trigger";
  import { onDestroy, onMount } from "svelte";
  import { DeviceClass } from "../interfaces/component";
  import { SetLayout } from "./setLayout";
  import { ResetLayout } from "./resetLayout";
  import {runtime} from "../runtime";

  // If the compositor or the contained display component (leaf) should be able to receive events,
  // they need to have a id.
  // The id is specified in the "Component" and must be unique.
  let id;

  // The "composition" contains the display document.
  export let component: Component;

  export let loader;

  export let domElement;

  // A Component (see "composition") can contain multiple display documents. One for each DeviceClass.
  // This variable holds the current ComponentDefinition that was chosen by the Compositor.
  let componentDefinition: ComponentDefinition | undefined;
  let deviceClass: DeviceClass = DeviceClass.mobile;

  // Contains the svelte component instance.
  let componentInstance;

  // When the "Component" has a "id" assigned, this variable will contain the corresponding event stream.
  let eventStream;
  let eventSubscription;

  let overrideLayout;

  onMount(() => {
    // Determine the DeviceClass
    deviceClass = runtime.getDeviceClass();

    // Register all component runtime instances
    if (component && component.id) {
      eventStream = runtime.register(component.id, componentInstance);
      id = component.id;
    }
  });

  onDestroy(() => {
    // Remove all component runtime instances
    if (component && component.id) {
      runtime.remove(component.id);
      eventStream = null;
      if (eventSubscription) {
        eventSubscription.unsubscribe();
      }
    }
  });

  let actions = {
    [ResetLayout.type]: (trigger: ResetLayout) => {
      overrideLayout = undefined;
    },
    [SetLayout.type]: (trigger: SetLayout) => {
      overrideLayout = trigger.layoutName;
    },
  };

  function getAreas(componentDefinition) {
    return loader.layout.getLayoutByName(componentDefinition.layout).areas;
  }

  function getRows(componentDefinition) {
    return loader.layout.getLayoutByName(componentDefinition.layout).rows;
  }

  function getColumns(componentDefinition) {
    return loader.layout.getLayoutByName(componentDefinition.layout).columns;
  }

  /**
   * Handles incoming events and calls the corresponding actions.
   */
  function eventHandler(trigger: Trigger | undefined) {
    // TODO: This is the same code as in App.svelte
    if (trigger.triggers) {
      // This event should trigger some action. Find it in the action repo and execute it.
      const foundAction = actions[trigger.triggers];
      if (foundAction) {
        foundAction(trigger);
      }
    }
  }

  $: {
    if (component) {
      const def = runtime.findComponentDefinition(component);

      if (def && overrideLayout) {
        def.layout = overrideLayout;
      }

      componentDefinition = def;

      // Remove the instance if the underlying Component its id
      if (id && id !== component.id) {
        runtime.remove(id);
        eventStream = null;
        if (eventSubscription) {
          eventSubscription.unsubscribe();
        }
      }

      id = component.id;
      if (id && componentInstance && !runtime.find(id)) {
        eventStream = runtime.register(id, componentInstance);
      }
    }

    if (!eventSubscription && eventStream) {
      eventSubscription = eventStream.subscribe(eventHandler);
    }
  }
</script>

<style>
  .compositor {
    height: 100%;
    display: grid;
    grid-template-areas: var(--areas);
    grid-template-columns: var(--columns);
    grid-template-rows: var(--rows);
    overflow: hidden;
  }
</style>

<svelte:options accessors />
{#if componentDefinition && (!componentDefinition.children || componentDefinition.children.length === 0 || componentDefinition.view)}
  <!-- This branch handles leaf-components -->
  <section
    bind:this={domElement}
    style="grid-area: {componentDefinition.area}; display: grid; grid-template-columns:
    'minmax(1fr)'; grid-template-rows: 'minmax(1fr)'; overflow: hidden; height:100%;">
     <!-- <div class={componentDefinition.cssClasses} style="width:100%; height:100%; overflow:auto">-->
        <svelte:component
          this={loader.getViewByName(componentDefinition.view)}
          bind:this={componentInstance}
          {loader}
          {component}
          data={componentDefinition.data} />
      <!--</div>-->
  </section>
{:else if componentDefinition}
  <!-- This branch handles container-components -->
  <section
          bind:this={domElement}
          class="compositor"
          style="grid-area: {componentDefinition.area}; --areas: {getAreas(componentDefinition)};
            --columns: {getColumns(componentDefinition)}; --rows: {getRows(componentDefinition)};">
    {#each componentDefinition.children as child}
      {#if loader.layout.isAreaAvailable(componentDefinition.layout, child)}
        <svelte:self
                {loader}
                bind:this={componentInstance}
                component={child} />
      {:else}
      <!-- When a child has no 'area' to go to (it's area is not defined in the parent's layout),
        we simply shoot it to the moon.. -->
        <div style="position:absolute; left:-2000em; top:-2000em; visibility:hidden;">
          <svelte:self
                  {loader}
                  bind:this={componentInstance}
                  component={child} />
        </div>
      {/if}
    {/each}
  </section>
{/if}
