import { NextResponse } from "next/server";
import { createApplication, type ApplicationInput } from "@neomokdeul/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    const required = [
      "name",
      "phone",
      "gender",
      "birthYear",
      "motivation",
      "source",
      "agreed",
    ];
    for (const k of required) {
      if (body[k] === undefined || body[k] === "" || body[k] === null) {
        return NextResponse.json(
          { error: `필수 항목 누락: ${k}` },
          { status: 400 }
        );
      }
    }

    if (!body.agreed) {
      return NextResponse.json(
        { error: "개인정보 수집 동의가 필요합니다" },
        { status: 400 }
      );
    }

    if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(body.phone)) {
      return NextResponse.json(
        { error: "전화번호 형식이 올바르지 않습니다" },
        { status: 400 }
      );
    }

    const input: ApplicationInput = {
      name: String(body.name),
      phone: String(body.phone),
      gender: body.gender === "female" ? "female" : "male",
      birthYear: Number(body.birthYear),
      motivation: String(body.motivation),
      source: String(body.source),
      agreed: Boolean(body.agreed),
      voiceFileName: body.voiceFileName ? String(body.voiceFileName) : undefined,
      photoFileName: body.photoFileName ? String(body.photoFileName) : undefined,
    };

    const app = await createApplication(input);
    return NextResponse.json({ ok: true, id: app.id }, { status: 201 });
  } catch (err) {
    console.error("[apply]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
