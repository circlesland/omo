import { Subject } from "rxjs";
export class EventBroker {
    constructor() {
        this._topics = {};
    }
    /**
     * Creates a new topic and assigns it a unique name.
     * @param namespace A namespace
     * @param name The unique topic name within the namespace
     */
    createTopic(namespace, name) {
        if (this._topics[name]) {
            throw new Error(`A topic with the name ${name} already exists.`);
        }
        const topic = new Topic(namespace, name);
        let ns = this._topics[namespace];
        if (!ns) {
            ns = this._topics[namespace] = {};
        }
        ns[name] = topic;
        return topic;
    }
    /**
     * Gets an existing topic.
     * @param namespace
     * @param name
     */
    getTopic(namespace, name) {
        const ns = this._topics[namespace];
        if (!ns) {
            throw new Error(`There is no namespace with the name '${namespace}'.`);
        }
        const topic = ns[name];
        if (!topic) {
            throw new Error(`There is no topic with the name '${name}' in the namespace '${namespace}'.`);
        }
        return topic;
    }
    tryGetTopic(namespace, name) {
        const ns = this._topics[namespace];
        if (!ns) {
            return null;
        }
        const topic = ns[name];
        if (!topic) {
            return null;
        }
        return topic;
    }
    removeTopic(namespace, name) {
        const ns = this._topics[namespace];
        if (!ns) {
            console.warn("EventBroker: The topic '" + name + "' in namespace '" + namespace + "' that should be removed doesn't exist (namespace doesn't exist).");
            return;
        }
        const topic = ns[name];
        if (!topic) {
            console.warn("EventBroker: The topic '" + name + "' in namespace '" + namespace + "' that should be removed doesn't exist (topic doesn't exist).");
            return;
        }
        delete ns[name];
        // When this was the last topic in a namespace, remove the namespace as well
        if (Object.keys(ns).length == 0) {
            delete this._topics[namespace];
        }
    }
}
export class Topic {
    constructor(namespace, name) {
        /**
         * Contains all dependency handlers which will be processed in a blocking manner before everything else.
         */
        this.dependencies = [];
        this._namespace = namespace;
        this._name = name;
        this._observable = new Subject();
    }
    /**
     * The name of the topic (must be unique within the namespace)
     */
    get name() {
        return this._name;
    }
    get namespace() {
        return this._namespace;
    }
    /**
     * The event source for regular subscribers.
     */
    get observable() {
        return this._observable;
    }
    /**
     * Publishes a new fire-and-forget event to the topic.
     * @param event
     */
    async publish(event) {
        // First fulfill all dependencies..
        const promises = [];
        for (let dep of this.dependencies) {
            promises.push(dep(event));
        }
        await Promise.all(promises);
        this._observable.next(event);
    }
    /**
     * Can be used instead of a subscription to the 'observable' property but blocks until all
     * dependencies are processed.
     * Dependencies are processed before any normal events are dispatched.
     * @param dependency The actual promise-returning callback
     */
    depend(dependency) {
        this.dependencies.push(dependency);
    }
}
//# sourceMappingURL=eventBroker.js.map