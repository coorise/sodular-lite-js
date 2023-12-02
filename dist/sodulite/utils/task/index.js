"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Queue_instances, _Queue_processQueue;
Object.defineProperty(exports, "__esModule", { value: true });
class Queue {
    constructor() {
        _Queue_instances.add(this);
        this.queue = [];
        this.isProcessing = false;
    }
    add(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.queue.push({ task, resolve });
                if (!this.isProcessing) {
                    __classPrivateFieldGet(this, _Queue_instances, "m", _Queue_processQueue).call(this);
                }
            });
        });
    }
}
_Queue_instances = new WeakSet(), _Queue_processQueue = function _Queue_processQueue() {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }
        this.isProcessing = true;
        const { task, resolve } = this.queue.shift();
        try {
            const result = yield task();
            resolve(result);
        }
        catch (error) {
            resolve(null);
        }
        yield __classPrivateFieldGet(this, _Queue_instances, "m", _Queue_processQueue).call(this);
    });
};
exports.default = Queue;
