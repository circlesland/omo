export const Login = {
    needsAuthorization: false,
    area: "main",
    layout: "LayoutMain",
    children: [
        {
            area: "main",
            component: "OmoLogin",
            properties: { title: "Follow your passion", image: "/start.jpg", link: "safe" },
            trigger: [],
            children: [
                {
                    area: "",
                    component: "OmoLogin",
                },
            ],
        },
    ],
};
//# sourceMappingURL=Login.js.map