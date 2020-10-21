export class Kernel {
    // ipfsNode: IPFS = IPFS.create();
    registry: Registry = new Registry();
}
type RegistryEntry = {
    name: string;
    cid: string;
    classes: string[];
}
export class Registry {
    private lookup: { key: RegistryEntry, value: new () => object }[] = [];

    register<S extends new () => object>(s: S): Registry {

        const entry: RegistryEntry = {
            name: s.name,
            cid: s.name,
            classes: Registry.getClasses(s)
        };

        this.lookup.push({ key: entry, value: s });
        return this;
    }

    get<S extends new () => object>(name: string): S | null {
        let type = this.lookup.find(x => x.key.name == name).value;
        return type ? type as S : null;
    }

    static getClasses<S extends new () => object>(s: S, arr?: string[]): string[] {
        if (!s) return arr;
        arr = arr ? arr : [];
        if (s.name == "") return;
        arr.push(s.name);
        Registry.getClasses(Object.getPrototypeOf(s), arr);
        return arr;
    }
}