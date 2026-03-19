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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var snaptrade_typescript_sdk_1 = require("snaptrade-typescript-sdk");
var fs_1 = require("fs");
var snaptrade = new snaptrade_typescript_sdk_1.Snaptrade({
    clientId: "PERS-E3AD48IDJZGU8R4S2DSW",
    consumerKey: "uJH84wYV9c8NZybFFNPbx0sRtGPIqzMijKbauR0puL8fI0CCGy"
});
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var usersResponse, users, uid, reg, secret, accountsRes, accounts, accountId, activities, e_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    console.log("Fetching live users...");
                    return [4 /*yield*/, snaptrade.authentication.listSnapTradeUsers()];
                case 1:
                    usersResponse = _c.sent();
                    users = usersResponse.data;
                    if (!users || users.length === 0) {
                        console.log("No users found.");
                        return [2 /*return*/];
                    }
                    uid = users[0].id || users[0].userId || users[0];
                    console.log("Found target user: ".concat(uid));
                    console.log("Fetching User Secret via Idempotency hack...");
                    return [4 /*yield*/, snaptrade.authentication.registerSnapTradeUser({ userId: uid })];
                case 2:
                    reg = _c.sent();
                    secret = (_a = reg.data) === null || _a === void 0 ? void 0 : _a.userSecret;
                    if (!secret)
                        return [2 /*return*/];
                    console.log("Fetching Accounts...");
                    return [4 /*yield*/, snaptrade.accountInformation.listUserAccounts({ userId: uid, userSecret: secret })];
                case 3:
                    accountsRes = _c.sent();
                    accounts = accountsRes.data || [];
                    if (accounts.length === 0)
                        return [2 /*return*/, console.log("No connected accounts.")];
                    accountId = accounts[0].id;
                    console.log("Pinging activities for Account ".concat(accountId, "..."));
                    return [4 /*yield*/, snaptrade.accountInformation.getAccountActivities({
                            userId: uid,
                            userSecret: secret,
                            accountId: accountId,
                            startDate: "2024-01-01"
                        })];
                case 4:
                    activities = _c.sent();
                    // Save raw dump to analyze Option Leg structure
                    fs_1.default.writeFileSync('snaptrade_dump.json', JSON.stringify(activities.data, null, 2));
                    console.log("Saved ".concat(activities.data.length, " historic executions to snaptrade_dump.json!"));
                    if (activities.data.length > 0) {
                        console.log("\nSample execution:");
                        console.log(activities.data[0]);
                    }
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _c.sent();
                    console.log("Error:", ((_b = e_1.response) === null || _b === void 0 ? void 0 : _b.data) ? JSON.stringify(e_1.response.data) : e_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
run();
