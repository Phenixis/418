import { NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
	return NextResponse.next()
}