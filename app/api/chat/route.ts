import { NextRequest, NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const flaskRes = await fetch(`${FLASK_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await flaskRes.json();

        if (!flaskRes.ok) {
            return NextResponse.json(
                { error: data.error || "Flask server error" },
                { status: flaskRes.status }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("[/api/chat] Error:", err);
        return NextResponse.json(
            { error: "Could not reach the health server. Is Python app.py running?" },
            { status: 503 }
        );
    }
}
