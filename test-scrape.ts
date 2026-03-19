import { Snaptrade } from 'snaptrade-typescript-sdk';
import fs from 'fs';

const snaptrade = new Snaptrade({
    clientId: "PERS-E3AD48IDJZGU8R4S2DSW",
    consumerKey: "uJH84wYV9c8NZybFFNPbx0sRtGPIqzMijKbauR0puL8fI0CCGy"
});

async function run() {
    try {
        console.log("Fetching live users...");
        const usersResponse = await snaptrade.authentication.listSnapTradeUsers();
        const users = usersResponse.data;
        
        if (!users || users.length === 0) {
            console.log("No users found.");
            return;
        }

        const uid = (users[0] as any).id || (users[0] as any).userId || users[0];
        console.log(`Found target user: ${uid}`);
        
        console.log("Fetching User Secret via Idempotency hack...");
        const reg = await snaptrade.authentication.registerSnapTradeUser({ userId: uid });
        const secret = reg.data?.userSecret;

        if (!secret) return;

        console.log("Fetching Accounts...");
        const accountsRes = await snaptrade.accountInformation.listUserAccounts({ userId: uid, userSecret: secret });
        const accounts = accountsRes.data || [];
        
        if (accounts.length === 0) return console.log("No connected accounts.");

        const accountId = accounts[0].id;
        console.log(`Pinging activities for Account ${accountId}...`);

        // Fetch Activities
        const activities = await snaptrade.accountInformation.getAccountActivities({ 
             userId: uid, 
             userSecret: secret, 
             accountId: accountId,
             startDate: "2024-01-01"
        });

        // Save raw dump to analyze Option Leg structure
        fs.writeFileSync('snaptrade_dump.json', JSON.stringify(activities.data, null, 2));
        console.log(`Saved ${activities.data.length} historic executions to snaptrade_dump.json!`);
        
        if (activities.data.length > 0) {
            console.log("\nSample execution:");
            console.log(activities.data[0]);
        }
        
    } catch (e: any) {
        console.log("Error:", e.response?.data ? JSON.stringify(e.response.data) : e.message);
    }
}
run();
