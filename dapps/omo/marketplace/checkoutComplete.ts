import type { Component } from "../../../kernel/interfaces/component";

export const Checkout: Component = {
  needsAuthorization: false,
  area: "main",
  layout: "LayoutMain",
  children: [
    {
      area: "main",
      view: "Login",
      data: { title: "Follow your passion", image: "/start.jpg", link: "safe" },
      trigger: [],
      children: [
        {
          area: "",
          view: "Login",
        },
      ],
    },
  ],
};