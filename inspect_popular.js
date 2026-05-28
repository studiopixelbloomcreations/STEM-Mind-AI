import { Client } from "@gradio/client";

async function test(space) {
    try {
        console.log(`\n=============================`);
        console.log(`Connecting to ${space}...`);
        const client = await Client.connect(space);
        console.log("Connected! Viewing APIs...");
        
        // Let's call /predict or whatever endpoints are available
        const apis = client.config.dependencies || [];
        console.log("Dependencies length:", apis.length);
        
        // Try predicting with "Hello world"
        // Let's check if the space has a predict endpoint
        const predictEndpoints = client.config.api_endpoints || {};
        console.log("API Endpoints:", Object.keys(predictEndpoints));
        
        // Try calling the first endpoint that looks like a speech generator
        // In Gradio 4/5, client.predict accepts api_name or fn_index
        // Let's print the endpoints and signatures:
    } catch (e) {
        console.error(`Failed for ${space}:`, e.message || e);
    }
}

async function run() {
    await test("hexgrad/Kokoro-TTS");
    await test("ysharma/Make_Custom_Voices_With_KokoroTTS");
    await test("NeuralFalcon/KOKORO-TTS-1.0");
    await test("NeuralFalcon/Kokoro-TTS");
}

run();
