import { Snaptrade } from 'snaptrade-typescript-sdk';

const snaptrade = new Snaptrade({
    clientId: "PERS-E3AD48IDJZGU8R4S2DSW",
    consumerKey: "uJH84wYV9c8NZybFFNPbx0sRtGPIqzMijKbauR0puL8fI0CCGy"
});

async function run() {
    try {
        console.log("Attempting Register 1...");
        const r1 = await snaptrade.authentication.registerSnapTradeUser({ userId: "test-user-xyz" });
        console.log("Secret 1:", r1.data.userSecret);
        
        console.log("Attempting Register 2...");
        const r2 = await snaptrade.authentication.registerSnapTradeUser({ userId: "test-user-xyz" });
        console.log("Secret 2:", r2.data.userSecret);
        
        await snaptrade.authentication.deleteSnapTradeUser({ userId: "test-user-xyz" });
    } catch (e: any) {
        console.log("Verbose Error:", e.response?.data ? JSON.stringify(e.response.data) : e.message);
        
        // Clean up on fail
        await snaptrade.authentication.deleteSnapTradeUser({ userId: "test-user-xyz" });
    }
}
run();
