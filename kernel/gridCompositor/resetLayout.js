import { Actions } from "../interfaces/actions";
export class ResetLayout {
    constructor(targetId) {
        this.title = "ResetLayout";
        this.triggers = Actions.resetLayout;
        this.id = targetId;
    }
}
//# sourceMappingURL=resetLayout.js.map