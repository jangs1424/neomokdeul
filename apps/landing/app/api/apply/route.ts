import { NextResponse } from "next/server";
import { createApplication, getCohort, type ApplicationInput } from "@neomokdeul/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required scalar fields
    const required = [
      "name",
      "phone",
      "gender",
      "birthYear",
      "occupation",
      "region",
      "motivation",
      "source",
      "agreed",
      "cohortId",
      "voiceFilePath",
      "photoFilePath",
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

    // callTimes: required array with at least 1 element
    if (!Array.isArray(body.callTimes) || body.callTimes.length === 0) {
      return NextResponse.json(
        { error: "통화 가능 시간대를 하나 이상 선택해주세요" },
        { status: 400 }
      );
    }

    // mbti: optional, validate format if provided
    if (body.mbti !== undefined && body.mbti !== null && body.mbti !== "") {
      if (!/^[IE][NS][TF][JP]$/.test(String(body.mbti))) {
        return NextResponse.json(
          { error: "MBTI 형식이 올바르지 않습니다" },
          { status: 400 }
        );
      }
    }

    // previousCohort: required boolean
    if (typeof body.previousCohort !== "boolean") {
      return NextResponse.json(
        { error: "필수 항목 누락: previousCohort" },
        { status: 400 }
      );
    }

    // cohortId: required, must exist, recruiting, and apply window open
    if (!body.cohortId || typeof body.cohortId !== "string") {
      return NextResponse.json(
        { error: "필수 항목 누락: cohortId" },
        { status: 400 }
      );
    }

    const cohort = await getCohort(String(body.cohortId));
    if (!cohort) {
      return NextResponse.json(
        { error: "존재하지 않는 기수입니다" },
        { status: 400 }
      );
    }
    if (cohort.status !== "recruiting") {
      return NextResponse.json(
        { error: "현재 모집 중인 기수가 아닙니다" },
        { status: 400 }
      );
    }
    const now = new Date();
    if (new Date(cohort.applyOpensAt) > now || new Date(cohort.applyClosesAt) <= now) {
      return NextResponse.json(
        { error: "신청 기간이 아닙니다" },
        { status: 400 }
      );
    }

    const input: ApplicationInput = {
      name: String(body.name),
      phone: String(body.phone),
      gender: body.gender === "female" ? "female" : "male",
      birthYear: Number(body.birthYear),
      occupation: String(body.occupation),
      region: String(body.region),
      callTimes: (body.callTimes as unknown[]).map(String),
      mbti: body.mbti ? String(body.mbti) : undefined,
      previousCohort: Boolean(body.previousCohort),
      cohortId: String(body.cohortId),
      motivation: String(body.motivation),
      source: String(body.source),
      agreed: Boolean(body.agreed),
      voiceFilePath: body.voiceFilePath ? String(body.voiceFilePath) : undefined,
      photoFilePath: body.photoFilePath ? String(body.photoFilePath) : undefined,
    };

    const app = await createApplication(input);
    return NextResponse.json({ ok: true, id: app.id }, { status: 201 });
  } catch (err) {
    console.error("[apply]", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
