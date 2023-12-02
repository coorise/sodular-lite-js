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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sodulite_1 = __importDefault(require("../sodulite"));
let db = sodulite_1.default.init({
    dbName: 'sodulite @&',
    path: './database@/project-Z $é/',
    mode: 'dev',
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    db = db.load('data');
    let op;
    let alice = yield db
        .ref('/members/users/0')
        .get()
        .catch((e) => {
        console.log('Get Alice Error: ', e);
    });
    console.log('Get Alice:', {
        path: alice.path,
        key: alice.key,
        value: alice.value,
        error: alice.error,
    });
    op = yield db
        .ref('/members/users[0;1]')
        .query(null, (snapshot) => {
        console.log('Query Alice: ', {
            path: snapshot.path,
            key: snapshot.key,
            value: snapshot.value,
            error: snapshot.error,
        });
    })
        .catch((e) => {
        console.log('Query Alice Error: ', e);
    });
}))();
