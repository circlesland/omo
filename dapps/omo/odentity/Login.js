export const Login = {
    needsAuthorization: false,
    area: "main",
    layout: "LayoutMain",
    children: [
        {
            area: "main",
            component: "Login",
            properties: { title: "Follow your passion", image: "/start.jpg", link: "safe" },
            trigger: [],
            children: [
                {
                    area: "",
                    component: "Login",
                },
            ],
        },
    ],
};
//# sourceMappingURL=Login.js.map