import { Actions } from "../interfaces/actions";
export class SetLayout {
    constructor(targetId, layoutName) {
        this.title = "SetLayout";
        this.triggers = Actions.setLayout;
        this.id = targetId;
        this.layoutName = layoutName;
    }
}
//# sourceMappingURL=setLayout.js.map