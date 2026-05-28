import { Client } from "@gradio/client";

async function run() {
    try {
        console.log("Connecting to brainzcode/hexgrad-Kokoro-82M...");
        const client = await Client.connect("brainzcode/hexgrad-Kokoro-82M");
        console.log("Connected. Calling predict...");
        const result = await client.predict("/predict", ["Hello from Node.js"]);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error details:", e);
    }
}

run();
