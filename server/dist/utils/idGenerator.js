"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlayerId = exports.generateGameId = void 0;
const uuid_1 = require("uuid");
const generateGameId = () => {
    return (0, uuid_1.v4)().split('-')[0].toUpperCase();
};
exports.generateGameId = generateGameId;
const generatePlayerId = () => {
    return (0, uuid_1.v4)().split('-')[0].toLowerCase();
};
exports.generatePlayerId = generatePlayerId;
