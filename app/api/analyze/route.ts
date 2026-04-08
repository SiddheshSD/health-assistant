import { NextRequest, NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5000";

export async function GET() {
    // Return symptom list from Flask
    try {
        const res = await fetch(`${FLASK_URL}/symptoms`);
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ symptoms: [] }, { status: 503 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const flaskRes = await fetch(`${FLASK_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await flaskRes.json();

        if (!flaskRes.ok) {
            return NextResponse.json(
                { error: data.error || "Analysis failed" },
                { status: flaskRes.status }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("[/api/analyze] Error:", err);
        return NextResponse.json(
            { error: "Could not reach the health server. Is Python app.py running?" },
            { status: 503 }
        );
    }
}
